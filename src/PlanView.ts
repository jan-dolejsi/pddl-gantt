/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

 /* eslint-disable @typescript-eslint/no-use-before-define */

import { DomainInfo, Plan, PlanStep, PlanStepCommitment, HappeningType, HelpfulAction } from "pddl-workspace";
import { drawChart, isInViewport } from "./charts";
import { capitalize } from "./planCapitalization";
import { PlanVisualization } from "./PlanVisualization";
import { PlanVizSettings } from "./PlanVizSettings";
import { SwimLane } from "./SwimLane";

export interface PlanViewOptions {
    epsilon: number;
    displayWidth: number;
    disableSwimlanes?: boolean;
    disableLinePlots?: boolean;
    selfContained?: boolean;
    onActionSelected?: (actionName: string) => void;
    onHelpfulActionSelected?: (actionName: string) => void;
    onLinePlotsVisible?: (planView: PlanView) => void;
}

export const DIGITS = 4;

export function getHostElement(hostElementId: string): HTMLElement {
    const host = document.getElementById(hostElementId);
    if (host === null) {
        throw new Error(`Element with id#${hostElementId} not found in the document.`);
    }
    return host;
}

export class View {

    protected readonly host: HTMLElement;

    constructor(hostElement: HTMLDivElement,
        protected readonly options: PlanViewOptions) {
        this.host = hostElement;
    }

    /**
     * Sets new display width. Does not trigger (re-)drawing.
     * @param displayWidth new width in pixels, the width is used to fit all gantt chart bars (not necessarily the labels next to them)
     */
    public setDisplayWidth(displayWidth: number): void {
        this.options.displayWidth = displayWidth;
    }

    protected getOrCreateBlankChildElement(className: string): HTMLDivElement {
        const el = this.host.querySelector<HTMLDivElement>('.' + className);
        if (el) {
            el.innerHTML = '';
            // only removes half the children: el.childNodes.forEach(child => child.remove());
        }
        return el ?? this.createChildElement(className);
    }

    private createChildElement(className: string): HTMLDivElement {
        const child = document.createElement('div');
        child.className = className;
        return this.host.appendChild(child);
    }
}

const PLAN_VIZ = 'planViz';
const GANTT = 'gantt';
const RESOURCE_UTILIZATION = 'resourceUtilization';
const LINE_CHARTS = 'lineCharts';
export const ATTR_PLAN = "plan";
export const PLAN_VIEW_CLASS = "planView";

/** Single-plan view. */
export class PlanView extends View {

    private planStepHeight = 20;
    private lineCharts: HTMLDivElement | undefined;
    
    private handleScrollEvent: (() => void) | undefined;
    private linePlotsGenerated = false;
    private plan: Plan | undefined;
    private visible = true;

    constructor(hostElement: HTMLDivElement, public readonly planIndex: number, options: PlanViewOptions) {
        super(hostElement, options);

        if (this.host.style.width.length == 0) {
            this.host.style.width = px(options.displayWidth + 100);
        }
    }
    
    clear(): void {
        this.getOrCreateBlankChildElement(GANTT);
        this.getOrCreateBlankChildElement(RESOURCE_UTILIZATION);
        this.getOrCreateBlankChildElement(LINE_CHARTS);

        this.plan = undefined;
        this.deactivateLinePlotPlaceholder();
    }

    setVisible(visible: boolean): void {
        if (this.visible !== visible) {
            this.visible = visible;
            const newDisplayStyle = visible ? "block" : "none";
            this.host.style.display = newDisplayStyle;

            if (!this.linePlotsGenerated && this.plan) { 
                // line plots were not generated yet
                if (!visible) {
                    // unsubscribe scroll event
                    this.deactivateLinePlotPlaceholder();
                } else {
                    this.lineCharts && this.activateLinePlotPlaceholder(this.lineCharts, this.plan);
                }
            }
        }
    }

    showPlan(plan: Plan, settings?: PlanVizSettings): void {
        this.plan = capitalize(plan);

        const planVizDiv = this.getOrCreateBlankChildElement(PLAN_VIZ);
        this.tryVisualizePlan(planVizDiv, plan, settings);

        const stepsToDisplay = plan.steps
            .filter(step => PlanView.shouldDisplay(step, settings));
        
        const ganttDiv = this.getOrCreateBlankChildElement(GANTT);
        this.showGantt(ganttDiv, plan, stepsToDisplay)

        const swimLanes = this.getOrCreateBlankChildElement(RESOURCE_UTILIZATION);
        this.showSwimLanes(swimLanes, plan, settings);

        this.lineCharts = this.getOrCreateBlankChildElement(LINE_CHARTS);
        this.activateLinePlotPlaceholder(this.lineCharts, plan);
    }

    private tryVisualizePlan(planVizDiv: HTMLDivElement, plan: Plan, settings?: PlanVizSettings): void {
        try {
            this.visualizePlan(planVizDiv, plan, settings);
        }
        catch (ex) {
            planVizDiv.style.width = px(this.options.displayWidth);
            this.addError(planVizDiv, ex.message ?? '' + ex);
        }
    }

    addError(planVizDiv: HTMLDivElement, ex: string): void {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error';
        errorSpan.innerText = `Error: ` + ex;
        planVizDiv.appendChild(errorSpan);
    }

    private visualizePlan(planVizDiv: HTMLDivElement, plan: Plan, settings?: PlanVizSettings): void {
        const planVisualizationScript = settings?.getPlanVisualizationScript();
        if (planVisualizationScript) {
            const viz = eval(planVisualizationScript) as PlanVisualization;
            if (viz.visualizeHtml) {
                const vizHtml = viz.visualizeHtml(plan, this.options.displayWidth);
                planVizDiv.innerHTML = vizHtml;
            } else if (viz.visualizeInDiv) {
                viz.visualizeInDiv(planVizDiv, plan, this.options.displayWidth);
            } else if (viz.visualizeSvg) {
                const vizSvg = viz.visualizeSvg(plan, this.options.displayWidth);
                planVizDiv.appendChild(vizSvg);
            }
        }
    }

    showPlanLinePlots(title: string, yAxisUnit: string, objects: string[], data: (number | null)[][]): void {
        if (this.lineCharts) {
            this.hideLinePlotLoadingProgress();
            this.addLinePlot(title, yAxisUnit, objects, data);
        }
    }
    
    private showGantt(ganttDiv: HTMLDivElement, plan: Plan, stepsToDisplay: PlanStep[]): void {
        // split this to two batches and insert helpful actions in between
        const planHeadSteps = stepsToDisplay
            .filter(step => this.isPlanHeadStep(step, plan.now));
        const relaxedPlanSteps = stepsToDisplay
            .filter(step => !this.isPlanHeadStep(step, plan.now));

        const oneIfHelpfulActionsPresent = (plan.hasHelpfulActions() ? 1 : 0);
        const relaxedPlanStepIndexOffset = planHeadSteps.length + oneIfHelpfulActionsPresent;

        const ganttChartHeight = (stepsToDisplay.length + oneIfHelpfulActionsPresent) * this.planStepHeight;

        ganttDiv.style.height = px(ganttChartHeight);

        planHeadSteps
            .map((step, stepIndex) => this.renderGanttStep(ganttDiv, step, stepIndex, plan));

        this.renderHelpfulActions(ganttDiv, plan, planHeadSteps.length);

        relaxedPlanSteps
                .map((step, stepIndex) => this.renderGanttStep(ganttDiv, step, stepIndex + relaxedPlanStepIndexOffset, plan));
    }

    private renderGanttStep(ganttDiv: HTMLDivElement, step: PlanStep, index: number, plan: Plan): void {

        const fromTop = index * this.planStepHeight;
        const fromLeft = this.computeLeftOffset(step, plan);
        const planHeadDuration = this.computePlanHeadDuration(step, plan);
        const width = this.computeWidth(planHeadDuration, plan);
        const widthRelaxed = this.computeRelaxedWidth(planHeadDuration, step, plan);

        const actionColor = plan.domain ? this.getActionColor(step, plan.domain) : 'gray';
        const actionIterations = step.getIterations() > 1 ? `${step.getIterations()}x` : '';

        const planStep = document.createElement('div');
        planStep.id = "plan${planIndex}step${index}";
        planStep.className = "planstep";
        planStep.style.left = px(fromLeft);
        planStep.style.top = px(fromTop);

        const planStepBar = document.createElement('div');
        planStepBar.className = "planstep-bar";
        planStepBar.title = this.toActionTooltipPlain(step);
        planStepBar.style.width = px(width);
        planStepBar.style.backgroundColor = actionColor;

        const planStepBarRelaxed = document.createElement('div');
        planStepBarRelaxed.className = "planstep-bar-relaxed whitecarbon";
        planStepBarRelaxed.style.width = px(widthRelaxed);

        const actionLink = this.toActionLink(step.getActionName(), plan);

        const text = document.createTextNode(` ${step.getObjects().join(' ')} ${actionIterations}`);

        planStep.append(planStepBar, planStepBarRelaxed, actionLink, text);
        ganttDiv.appendChild(planStep);
    }

    private renderHelpfulActions(ganttDiv: HTMLDivElement, plan: Plan, planHeadLength: number): void {
        if (plan.hasHelpfulActions()) {
            const fromTop = planHeadLength * this.planStepHeight;
            const fromLeft = this.toViewCoordinates(plan.now, plan);

            const helpfulActions = document.createElement("div");
            helpfulActions.className = "planstep";
            helpfulActions.style.top = px(fromTop);
            helpfulActions.style.left = px(fromLeft);
            helpfulActions.style.marginTop = px(3);


            const arrow = document.createTextNode(`▶ `);
            helpfulActions.appendChild(arrow);

            plan.helpfulActions
                ?.forEach((helpfulAction, index) =>
                    this.renderHelpfulAction(helpfulActions, index, helpfulAction));

            ganttDiv.appendChild(helpfulActions);
        }
    }

    private renderHelpfulAction(helpfulActions: HTMLDivElement, index: number, helpfulAction: HelpfulAction): void {
        const suffix = PlanView.getActionSuffix(helpfulAction);
        const beautifiedName = `${helpfulAction.actionName}<sub>${suffix}</sub>`;

        helpfulActions.appendChild(document.createTextNode(`${index + 1}. `));

        const a = document.createElement("a");
        a.className = "action";
        a.onclick = (): void => this.options.onHelpfulActionSelected?.(helpfulAction.actionName);
        a.innerHTML = beautifiedName;
        
        helpfulActions.appendChild(a);
    }

    private static getActionSuffix(helpfulAction: HelpfulAction): string {
        switch (helpfulAction.kind) {
            case HappeningType.START:
                return '├';
            case HappeningType.END:
                return '┤';
        }
        return '';
    }

    private computeLeftOffset(step: PlanStep, plan: Plan): number {
        return this.toViewCoordinates(step.getStartTime(), plan);
    }
    
    /** Converts the _time_ argument to view coordinates */
    private toViewCoordinates(time: number | undefined, plan: Plan): number {
        return (time ?? 0) / plan.makespan * this.options.displayWidth;
    }

    private toActionLink(actionName: string, plan: Plan): Node {
        if (this.options.selfContained || !plan.domain) {
            return document.createTextNode(actionName);
        }
        else {
            const a = document.createElement("a");
            a.className = "action"
            a.onclick = (): void => this.options.onActionSelected?.(actionName);
            a.title = `Reveal '${actionName}' action in the domain file`;
            a.innerText = actionName;
            return a;
        }
    }
    
    private toActionTooltip(tooltipHost: HTMLSpanElement, step: PlanStep): void {
      
        const table = document.createElement("table");

        {
            const tr = document.createElement("tr");
            const th = document.createElement("th");
            
            th.className = "actionToolTip";
            th.setAttribute("colspan", "" + 2);
            th.innerText = `${step.getActionName()} ${step.getObjects().join(' ')}`;

            tr.appendChild(th);
            table.appendChild(tr);
        }

        {
            const tr = document.createElement("tr");
            {
                const td = document.createElement("td");
                td.className = "actionToolTip";

                td.style.width = px(50);
                td.innerText = "Start: ";
                tr.appendChild(td);
            }
            {
                const td = document.createElement("td");
                td.className = "actionToolTip";
                td.innerText = `${step.getStartTime().toFixed(DIGITS)}`;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        if (step.isDurative && step.getDuration() !== undefined) {
            {
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.className = "actionToolTip";
                    td.innerText = "Duration: ";

                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.className = "actionToolTip";
                    td.innerText = step.getDuration()?.toFixed(DIGITS) ?? '';
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            {
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.className = "actionToolTip";
                    td.innerText = "End: ";

                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.className = "actionToolTip";
                    td.innerText = step.getEndTime().toFixed(DIGITS);

                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
        }

        tooltipHost.appendChild(table);
    }

    private toActionTooltipPlain(step: PlanStep): string {
        const durationRow = step.isDurative && step.getDuration() !== undefined ?
            `Duration: ${step.getDuration()?.toFixed(DIGITS)}, End: ${step.getEndTime().toFixed(DIGITS)}` :
            '';

        const startTime = step.getStartTime() !== undefined ?
            `, Start: ${step.getStartTime().toFixed(DIGITS)}` :
            '';

        return `${step.getActionName()} ${step.getObjects().join(' ')}${startTime} ${durationRow}`;
    }

    private computePlanHeadDuration(step: PlanStep, plan: Plan): number {
        if (plan.now === undefined) { return step.getDuration() ?? this.options.epsilon; }
        else if (step.getEndTime() < plan.now) {
            if (step.commitment === undefined || step.commitment === PlanStepCommitment.Committed) {
                return step.getDuration() ?? this.options.epsilon;
            }
            else { return 0; } // the end was not committed yet
        }
        else if (step.getStartTime() >= plan.now) { return 0; }
        else {
            switch (step.commitment) {
                case undefined:
                case PlanStepCommitment.Committed:
                    return step.getDuration() ?? this.options.epsilon;
                case PlanStepCommitment.EndsInRelaxedPlan:
                    return 0;
                case PlanStepCommitment.StartsInRelaxedPlan:
                    return plan.now - step.getStartTime();
                default:
                    return 0; // should not happen
            }
        }
    }

    private computeWidth(planHeadDuration: number, plan: Plan): number {
        // remove the part of the planStep duration that belongs to the relaxed plan
        return Math.max(1, this.toViewCoordinates(planHeadDuration, plan));
    }

    private computeRelaxedWidth(planHeadDuration: number, step: PlanStep, plan: Plan): number {
        // remove the part of the planStep duration that belongs to the planhead part
        const relaxedDuration = (step.getDuration() ?? this.options.epsilon) - planHeadDuration;
        return this.toViewCoordinates(relaxedDuration, plan);
    }

    private isPlanHeadStep(step: PlanStep, timeNow: number | undefined): boolean {
        return timeNow === undefined ||
            step.commitment === undefined ||
            step.commitment === PlanStepCommitment.Committed ||
            step.commitment === PlanStepCommitment.EndsInRelaxedPlan;
    }
    
    private static shouldDisplay(planStep: PlanStep, settings?: PlanVizSettings): boolean {
        return settings?.shouldDisplay(planStep) ?? true;
    }

    static shouldDisplayObject(step: PlanStep, obj: string, domain?: DomainInfo, settings?: PlanVizSettings): boolean {
        if (!(PlanView.shouldDisplay(step, settings))) {
            return false;
        }
        
        const liftedAction = domain?.getActions()
            .find(a => a.getNameOrEmpty().toLowerCase() === step.getActionName().toLowerCase());

        if (!liftedAction) {
            console.debug('Unexpected plan action: ' + step.getActionName());
            return step.getObjects().includes(obj);
        }

        let fromArgument = 0; // search from this argument positional index
        do {
            const indexOfArgument = step.getObjects().indexOf(obj.toLowerCase(), fromArgument);
            fromArgument = indexOfArgument + 1;
            if (indexOfArgument > -1 && indexOfArgument < liftedAction.parameters.length) {
                const parameter = liftedAction.parameters[indexOfArgument];
                const shouldIgnoreThisArgument = settings?.shouldIgnoreActionParameter(liftedAction.name ?? 'unnamed', parameter.name);
                if (!shouldIgnoreThisArgument) {
                    return true;
                }
            }
        } while (fromArgument > 0);

        return false;
    }

    private getActionColor(step: PlanStep, domain?: DomainInfo): string {
        const actionIndex = domain?.getActions()
            .findIndex(action => action.getNameOrEmpty().toLowerCase() === step.getActionName().toLowerCase());
        if (actionIndex === undefined || actionIndex < 0) {
            return 'gray';
        }
        else {
            return this.colors[actionIndex * 7 % this.colors.length];
        }
    }

    private colors = ['#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00', '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff', '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff', '#ff00ff', '#ff00bf', '#ff0080', '#ff0040'];

    private showSwimLanes(swimLanes: HTMLDivElement, plan: Plan, settings?: PlanVizSettings): void {
        if (this.options.disableSwimlanes || !plan.domain || !plan.problem) {
            swimLanes.remove();
            return;
        }

        const allTypeObjects = plan.domain.getConstants().merge(plan.problem.getObjectsTypeMap());

        const table = document.createElement("table");

        plan.domain.getTypes()
            .filter(type => type !== "object")
            .forEach(type => {
                const typeObjects = allTypeObjects.getTypeCaseInsensitive(type);
                typeObjects && this.renderTypeSwimLanes(table, type, typeObjects.getObjects(), plan, settings);
            });
    
        swimLanes.appendChild(table);
    }

    private renderTypeSwimLanes(table: HTMLTableElement, type: string, objects: string[], plan: Plan, settings?: PlanVizSettings): void {
        const tr = document.createElement("tr");

        const tableHeaderTypeName = document.createElement("th");
        tableHeaderTypeName.innerText = type;

        const tableHeaderFill = document.createElement("th");
        tableHeaderFill.style.width = px(this.options.displayWidth);

        tr.append(tableHeaderTypeName, tableHeaderFill);
        table.appendChild(tr);
        
        objects.forEach(obj =>
            this.renderObjectSwimLane(table, obj, plan, settings));
    }

    private renderObjectSwimLane(table: HTMLTableElement, obj: string, plan: Plan, settings?: PlanVizSettings): void {
        const subLanes = new SwimLane(1);

        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.className = "objectName";
        tdName.innerText = obj;

        const tdLane = document.createElement("td");
        tdLane.style.position = "relative";
       
        plan.steps
            .filter(step => PlanView.shouldDisplayObject(step, obj, plan.domain, settings))
            .forEach(step => this.renderSwimLaneStep(tdLane, step, plan, obj, subLanes));

        // now size the row appropriately
        tdLane.style.height = px(subLanes.laneCount() * this.planStepHeight);

        tr.append(tdName, tdLane);
        table.appendChild(tr);
    }

    private renderSwimLaneStep(tdLane: HTMLTableDataCellElement, step: PlanStep, plan: Plan, thisObj: string, swimLanes: SwimLane): void {
        const actionColor = this.getActionColor(step, plan.domain);
        const leftOffset = this.computeLeftOffset(step, plan);
        const planHeadDuration = this.computePlanHeadDuration(step, plan);
        const width = this.computeWidth(planHeadDuration, plan) + this.computeRelaxedWidth(planHeadDuration, step, plan);
        const objects = step.getObjects()
            .map(obj => obj.toLowerCase() === thisObj.toLowerCase() ? '@' : obj)
            .join(' ');

        const availableLane = swimLanes.placeNext(leftOffset, width);
        const fromTop = availableLane * this.planStepHeight + 1;

        const div = document.createElement("div");
        div.className = "resourceTaskTooltip";
        div.style.backgroundColor = actionColor;
        div.style.left = px(leftOffset)
        div.style.width = px(width);
        div.style.top = px(fromTop);

        const tooltipText = document.createElement("span");
        tooltipText.className = "resourceTaskTooltipText";
        this.toActionTooltip(tooltipText, step);

        div.append(`${step.getActionName()} ${objects}`, tooltipText);

        tdLane.appendChild(div);
    }

    /**
     * Line plots get populated lazily, when they get scrolled to the view.
     * @param lineCharts line chart element
     * @param plan plan being displayed
     */
    private activateLinePlotPlaceholder(lineCharts: HTMLDivElement, plan: Plan): void {
        if (this.options.disableLinePlots || !plan.domain || !plan.problem) {
            return;
        }
        
        this.deactivateLinePlotPlaceholder();

        if (isInViewport(lineCharts)) {
            // load charts immediately
            this.options.onLinePlotsVisible?.(this);
        }
        else {
            // defer cart loading

            // show loader
            this.addLoader(lineCharts);

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const planView = this;
            const scrollHandler = function handleScrollEvent(): void {
                const lineChartVisible = isInViewport(lineCharts);
        
                if (lineChartVisible) {
                    planView.options.onLinePlotsVisible?.(planView);
                    // unsubscribe the scroll events
                    // todo: can we call the planView.deactivateLinePlotPlaceholder(handleScrollEvent);
                    document.removeEventListener("scroll", handleScrollEvent);
                    document.removeEventListener("resize", handleScrollEvent);
                }
            };

            document.addEventListener('scroll', scrollHandler, { passive: true });
            document.addEventListener("resize", scrollHandler, { passive: true });

            // retain the handler, so it may be cleared along with the plan
            this.handleScrollEvent = scrollHandler;
        }
    }
    
    /** Removes the scroll events to avoid generating charts for plans that have been cleared from the view */
    private deactivateLinePlotPlaceholder(): void {
        if (this.handleScrollEvent !== undefined) {
            document.removeEventListener("scroll", this.handleScrollEvent);
            document.removeEventListener("resize", this.handleScrollEvent);
            this.handleScrollEvent = undefined;
        }
    }
    
    private addLoader(lineCharts: HTMLDivElement): void {
        // <div class="loader"></div>
        if (!lineCharts.querySelector("div.loader")) {
            // only ever add one loader, even if the scroll handler is activated/deactivated many times
            const loader = document.createElement("div");
            loader.className = "loader";
            lineCharts.appendChild(loader);
        }
    }

    hideLinePlotLoadingProgress(): void {
        this.lineCharts?.querySelector(".loader")?.remove();
    }

    private addLinePlot(title: string, yAxisUnit: string, objects: string[], data: (number | null)[][]): void {
        this.linePlotsGenerated = true;
        const linePlot = document.createElement("div");
        linePlot.className = "lineChart";

        linePlot.style.width = px(this.options.displayWidth + 100);
        linePlot.style.height = px(Math.round(this.options.displayWidth / 2));

        this.lineCharts?.appendChild(linePlot);

        if (!this.options.selfContained) {
            drawChart(linePlot, title, yAxisUnit, objects, data);
        } else {
            console.error("Line plots are not implemented in self-contained mode.");
            // todo: lineChartScripts += `        drawChart('${chartDivId}', '${chartTitleWithUnit}', '', ${JSON.stringify(values.legend)}, ${JSON.stringify(values.values)}, ${this.options.displayWidth});\n`;
        }
    }

}

export function px(valueInPx: number): string {
    return `${valueInPx}px`;
}

export function createPlanView(hostElementId: string, options: PlanViewOptions): PlanView {
    const hostElement = getHostElement(hostElementId) as HTMLDivElement;
    return new PlanView(hostElement, 0, options);
}

export function appendPlanView(parent: HTMLDivElement, planIndex: number, options: PlanViewOptions): PlanView {
    const hostElement = document.createElement('div');
    hostElement.setAttribute(ATTR_PLAN, planIndex.toString());
    hostElement.className = PLAN_VIEW_CLASS;
    const planView = new PlanView(hostElement, planIndex, options);
    parent.appendChild(hostElement);
    return planView;
}