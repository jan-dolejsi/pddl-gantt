/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Plan } from "pddl-workspace";
import { PlanViewOptions } from "./PlanView";

class PlansView {
    private selectedPlan = Number.NaN;

    constructor(hostElementId: string,
        private readonly options: PlanViewOptions,
        private readonly onPlanSelected?: (planIndex: number) => void,
        private readonly onActionSelected?: (actionName: string) => void,
        private readonly onHelpfulActionSelected?: (actionName: string) => void,
        private readonly onLinePlotsVisible?: (plan: Plan) => void) {
        
        const host = document.getElementById(hostElementId);
        if (host === null) {
            throw new Error(`Element with id#${hostElementId} not found in the document.`);
        }

        host.innerText = JSON.stringify(this.options);
    }

    setSelectedPlan(newSelectedPlan: number): void {
        if (this.selectedPlan != newSelectedPlan) {
            // remember the index of the plan that is being shown for later manipulation
            this.selectedPlan = newSelectedPlan;
            this.onPlanSelected?.(this.selectedPlan);
        }
    }

    showPlan(planIndex: number): void {
        return;
        this.setSelectedPlan(planIndex);
        document.querySelectorAll("div.stateView").forEach(div => this.showPlanDiv(planIndex, div));
        document.querySelectorAll("div.gantt").forEach(div => this.showPlanDiv(planIndex, div));
        document.querySelectorAll("div.resourceUtilization").forEach(div => this.showPlanDiv(planIndex, div));
        document.querySelectorAll("div.lineChart").forEach(div => this.showPlanDiv(planIndex, div));
        document.querySelectorAll("div.planSelector").forEach(div => {
            let newClass = "planSelector";
            const planIdAsStr = div.getAttribute("plan");
            if (planIdAsStr !== null) {
                const planId = parseInt(planIdAsStr);
                if (planIndex === planId) { newClass += " planSelector-selected"; }
                div.setAttribute("class", newClass);
            } else {
                console.warn(`planSelector element does not have the 'plan' attribute`);
            }
        });
        eval("drawPlan" + planIndex + "Charts();");
    }

    showPlanDiv(planIndex: number, div: Element): void {
        const planId = parseInt(div.getAttribute("plan") ?? "-1");
        const newDisplayStyle = planId === planIndex ? "block" : "none";
        (div as HTMLElement).style.display = newDisplayStyle;
        // let style = div.getAttribute("style");
        // style = style?.replace(/display: (none|block);/i, "display: " + newDisplayStyle + ';');
        // div.setAttribute("style", style);

        // todo: if line plots were not displayed yet, subscribe to the scrolling event
    }

    scrollPlanSelectorIntoView(planIndex: number): void {
        document.querySelectorAll('div.planSelector').forEach(div => {
            if (parseInt(div.getAttribute('plan') ?? "-1") === planIndex) {
                div.scrollIntoView();
            }
        });
    }

}

export function createPlansView(hostElementId: string,
    options: PlanViewOptions,
    onPlanSelected?: (planIndex: number) => void,
    onActionSelected?: (actionName: string) => void,
    onHelpfulActionSelected?: (actionName: string) => void,
    onLinePlotsVisible?: (plan: Plan) => void): PlansView {

    return new PlansView(hostElementId, options,
        onPlanSelected, onActionSelected, onHelpfulActionSelected,
        onLinePlotsVisible);
}
