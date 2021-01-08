/* eslint-disable @typescript-eslint/explicit-function-return-type */
// @ts-nocheck

import { createPlanView, PlanView } from "./PlanView";
import { createPlansView, PlansView } from "./PlansView";
import { JsonPlanVizSettings } from "./JsonPlanVizSettings";
import { parser, Plan, HappeningType, utils } from "pddl-workspace";

function onPlanSelected(planIndex: number): void {
    // todo: postMessage({ "command": "selectPlan", "planIndex": planIndex});
    console.log(`Plan selected: ${planIndex}`);
}

function onActionSelected(actionName: string): void {
    // const revealActionUri = encodeURI('command:pddl.revealAction?' + JSON.stringify([plan.domain.fileUri, actionName]));
    console.log(`Action selected: ${actionName}`);
}

function onHelpfulActionSelected(actionName: string): void {
    // todo: navigateToChildOfSelectedState(actionName)
    console.log(`Helpful action selected: ${actionName}`);
}

function onLinePlotsVisible(planView: PlanView): void {
    console.log(`Rendering charts using mock data ${planView.planIndex}`);
    setTimeout(() => planView.showPlanLinePlots("distance", "km", ["driver1", "driver2"], [[1, 10, 13], [2, 20, 7], [5, 15, 10]]), 1000);
    setTimeout(() => planView.showPlanLinePlots("fuel", "l", ["truck1", "truck2", "truck3"], [[1, 4, 6, 4], [4, 3, 5, 3], [5, 7, null, 2], [6, 7, 8, 2]]), 2000);
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
        onLinePlotsVisible: onLinePlotsVisible
    });

    plansView = createPlansView("plans", {
        disableSwimlanes: false, displayWidth: width, epsilon: EPSILON,
        onActionSelected: onActionSelected,
        onHelpfulActionSelected: onHelpfulActionSelected,
        onLinePlotsVisible: onLinePlotsVisible,
        onPlanSelected: onPlanSelected
    });
}

async function addPlan() {

    const domainText = document.getElementById("domainText")?.value ?? "";
    const problemText = document.getElementById("problemText")?.value ?? "";
    const planText = document.getElementById("planText")?.value ?? "";
    const settingsText = document.getElementById("settings")?.value ?? "{}";
    const planVisualizationText = document.getElementById("planVisualizationScript")?.value;

    const domain = parser.PddlDomainParser.parseText(domainText);
    const problem = await parser.PddlProblemParser.parseText(problemText);
    
    const planInfo = new parser.PddlPlanParser().parseText(planText, EPSILON);

    const settings = new JsonPlanVizSettings(JSON.parse(settingsText), planVisualizationText);

    const now = parseFloat(document.getElementById("now")?.value ?? "");
    
    const plan = new Plan(planInfo.getSteps(), domain, problem, now, [{ actionName: 'helpful1', kind: HappeningType.INSTANTANEOUS }]);
    plan.metric = planInfo.metric;
    
    // simulate the plan sent over JSON message
    const reHydratedPlan = Plan.clone(JSON.parse(JSON.stringify(utils.serializationUtils.makeSerializable(plan))));

    planView?.showPlan(reHydratedPlan, settings);
    plansView?.addPlan(reHydratedPlan, settings);
}

function clear(): void {
    planView?.clear();
    plansView?.clear();
}

document.getElementById("addPlan").onclick = addPlan;
document.getElementById("clear").onclick = clear;
document.body.onload = () => initialize();
