/* eslint-disable @typescript-eslint/explicit-function-return-type */
// @ts-nocheck

import { createPlanView, PlanView } from "./PlanView";
import { JsonPlanVizSettings } from "./JsonPlanVizSettings";
import { parser } from "pddl-workspace";

// function onPlanSelected(planIndex: number): void {
    // todo: postMessage({ "command": "selectPlan", "planIndex": planIndex});
//     console.log(`Plan selected: ${planIndex}`);
// }

function onActionSelected(actionName: string): void {
    // todo: postMessage({ "command": "selectPlan", "planIndex": planIndex});
    console.log(`Action selected: ${actionName}`);
}

function onHelpfulActionSelected(actionName: string): void {
    // todo: navigateToChildOfSelectedState(actionName)
    console.log(`Helpful action selected: ${actionName}`);
}

function onLinePlotsVisible(plan: Plan, planView: PlanView): void {
    console.log(`Render charts using mock data ${plan}`);
    setTimeout(() => planView.showPlanLinePlots("distance", "km", ["driver1", "driver2"], [[1, 10, 13], [2, 20, 7], [5, 15, 10]]), 1000);
}

let planView: PlanView | undefined;

const EPSILON = 1e-3;

function initialize() {
    const width = parseInt(document.getElementById("planViewWidth")?.getAttribute("value") ?? "400");
    planView = createPlanView("plan", onActionSelected, onHelpfulActionSelected,
        onLinePlotsVisible,
        { disableSwimlanes: false, displayWidth: width, epsilon: EPSILON });
}

async function addPlan() {

    const domainText = document.getElementById("domainText")?.value ?? "";
    const problemText = document.getElementById("problemText")?.value ?? "";
    const planText = document.getElementById("planText")?.value ?? "";
    const settingsText = document.getElementById("settings")?.value ?? "{}";

    const domain = parser.PddlDomainParser.parseText(domainText);
    const problem = await parser.PddlProblemParser.parseText(problemText);
    
    const planInfo = parser.PddlPlanParser.parseText(planText, EPSILON);

    planView?.showPlan(planInfo.getPlan(domain, problem), 0, new JsonPlanVizSettings(JSON.parse(settingsText)));
}

document.getElementById("addPlan").onclick = addPlan
document.body.onload = () => initialize();
