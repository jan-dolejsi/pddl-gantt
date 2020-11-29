/* eslint-disable @typescript-eslint/explicit-function-return-type */

/**
 * Plan selection callback
 * @param {number} planIndex selected plan
 * @returns {void}
 */
function onPlanSelected(planIndex) {
    // todo: postMessage({ "command": "selectPlan", "planIndex": planIndex});
    console.log(`Plan selected: ${planIndex}`);
}

/**
 * Action selection callback
 * @param {string} actionName selected action
 * @returns {void}
 */
function onActionSelected(actionName) {
    // const revealActionUri = encodeURI('command:pddl.revealAction?' + JSON.stringify([plan.domain.fileUri, actionName]));
    console.log(`Action selected: ${actionName}`);
}

/**
 * Helpful action selection callback
 * @param {string} actionName selected plan
 * @returns {void}
 */
function onHelpfulActionSelected(actionName) {
    // todo: navigateToChildOfSelectedState(actionName)
    console.log(`Helpful action selected: ${actionName}`);
}

/**
 * Line plots are in the viewport callback.
 * @param {Plan} plan plan
 * @param {PlanView} planView plan view component
 */
function onLinePlotsVisible(plan, planView) {
    console.log(`Render charts using mock data ${plan}`);
    setTimeout(() => planView.showPlanLinePlots("distance", "km", ["driver1", "driver2"], [[1, 10, 13], [2, 20, 7], [5, 15, 10]]), 1000);
    setTimeout(() => planView.showPlanLinePlots("fuel", "l", ["truck1", "truck2", "truck3"], [[1, 4, 6, 4], [4, 3, 5, 3], [6, 7, 8, 2]]), 2000);
}

/** @typeof {pddlGantt.PlanView | undefined} */
let planView;
/** @typeof {pddlGantt.PlansView | undefined} */
let plansView;

const EPSILON = 1e-3;

function initialize() {
    const width = parseInt(document.getElementById("planViewWidth")?.getAttribute("value") ?? "400");
    planView = pddlGantt.createPlanView("plan", onActionSelected, onHelpfulActionSelected,
        onLinePlotsVisible, { disableSwimlanes: false, displayWidth: width, epsilon: EPSILON });

    plansView = pddlGantt.createPlansView("plans", onPlanSelected, onActionSelected, onHelpfulActionSelected,
        onLinePlotsVisible, { disableSwimlanes: false, displayWidth: width, epsilon: EPSILON });
}

async function addPlan() {

    const domainText = document.getElementById("domainText")?.value ?? "";
    const problemText = document.getElementById("problemText")?.value ?? "";
    const planText = document.getElementById("planText")?.value ?? "";
    const settingsText = document.getElementById("settings")?.value ?? "{}";

    const domain = pddlWorkspace.parser.PddlDomainParser.parseText(domainText);
    const problem = await pddlWorkspace.parser.PddlProblemParser.parseText(problemText);
    
    const planInfo = pddlWorkspace.parser.PddlPlanParser.parseText(planText, EPSILON);

    const settings = new pddlGantt.JsonPlanVizSettings(JSON.parse(settingsText));
    planView?.showPlan(planInfo.getPlan(domain, problem), 0, settings);
    plansView?.showPlan(planInfo.getPlan(domain, problem), 0, settings);
}

document.getElementById("addPlan").onclick = addPlan
document.body.onload = () => initialize();
