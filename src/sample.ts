/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { createPlanView, PlanView } from "./PlanView";
import { createPlansView, PlansView } from "./PlansView";
import { JsonDomainVizConfiguration } from "./JsonDomainVizConfiguration";
import { parser, Plan, HappeningType, utils, VariableValue } from "pddl-workspace";

function onPlanSelected(planIndex: number): void {
    console.log(`Plan selected: ${planIndex}`);
}

function onActionSelected(actionName: string): void {
    console.log(`Action selected: ${actionName}`);
}

function onHelpfulActionSelected(actionName: string): void {
    console.log(`Helpful action selected: ${actionName}`);
}

function onLinePlotsVisible(planView: PlanView): void {
    console.log(`Rendering charts using mock data ${planView.planIndex}`);
    setTimeout(() => planView.showPlanLinePlots("distance", "km", ["driver1", "driver2"], [[1, 10, 13], [2, 20, 7], [5, 15, 10]]), 1000);
    setTimeout(() => planView.showPlanLinePlots("fuel", "l", ["truck1", "truck2", "truck3"], [[1, 4, 6, 4], [4, 3, 5, 3], [5, 7, null, 2], [6, 7, 8, 2]]), 2000);
}

function onFinalStateVisible(planView: PlanView): void {
    console.log(`Rendering final state using mock data ${planView.planIndex}`);
    setTimeout(() => planView.showFinalState([new VariableValue("predicate1", true), new VariableValue("fluent2", 3.14)]), 1000);
}

let planView: PlanView | undefined;
let plansView: PlansView | undefined;

const EPSILON = 1e-3;

function initialize() {
    const width = parseInt(document.getElementById("planViewWidth")?.getAttribute("value") ?? "400");
    planView = createPlanView("plan", {
        disableSwimlanes: false, displayWidth: width, epsilon: EPSILON,
        onActionSelected: onActionSelected,
        onHelpfulActionSelected: onHelpfulActionSelected,
        onLinePlotsVisible: onLinePlotsVisible,
        onFinalStateVisible: onFinalStateVisible
    });

    plansView = createPlansView("plans", {
        disableSwimlanes: false, displayWidth: width, epsilon: EPSILON,
        onActionSelected: onActionSelected,
        onHelpfulActionSelected: onHelpfulActionSelected,
        onLinePlotsVisible: onLinePlotsVisible,
        onFinalStateVisible: onFinalStateVisible,
        onPlanSelected: onPlanSelected
    });
}

function getTextAreaText(id: string, defaultValue=""): string {
    return (getElementByIdOrThrow(id) as HTMLTextAreaElement)?.value ?? defaultValue;
}

function getInputText(id: string, defaultValue=""): string {
    return (getElementByIdOrThrow(id) as HTMLInputElement)?.value ?? defaultValue;
}

async function addPlan() {

    const domainText: string = getTextAreaText("domainText");
    const problemText: string = getTextAreaText("problemText");
    const planText: string = getTextAreaText("planText")
    const configurationText: string = getTextAreaText("configuration", "{}");
    const planVisualizationText: string = getTextAreaText("planVisualizationScript");

    const domain = parser.PddlDomainParser.parseText(domainText);
    const problem = await parser.PddlProblemParser.parseText(problemText);
    
    const planInfo = new parser.PddlPlanParser().parseText(planText, EPSILON);

    const configuration = JsonDomainVizConfiguration.withCustomVisualizationScript(JSON.parse(configurationText), planVisualizationText);

    const now = parseFloat(getInputText("now"));
    
    const plan = new Plan(planInfo.getSteps(), domain, problem, now, [{ actionName: 'helpful1', kind: HappeningType.INSTANTANEOUS }]);
    plan.metric = planInfo.metric ?? Number.NaN;
    
    // simulate the plan sent over JSON message
    const reHydratedPlan = Plan.clone(JSON.parse(JSON.stringify(utils.serializationUtils.makeSerializable(plan))));

    planView?.showPlan(reHydratedPlan, configuration);
    plansView?.addPlan(reHydratedPlan, configuration);
}

function clear(): void {
    planView?.clear();
    plansView?.clear();
}

function getElementByIdOrThrow(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element ${id} not found in document.`);
    }
    return element;
}
    
getElementByIdOrThrow("addPlan").onclick = addPlan;
getElementByIdOrThrow("clear").onclick = clear;
document.body.onload = () => initialize();
