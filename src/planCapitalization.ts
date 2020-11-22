/* --------------------------------------------------------------------------------------------
* Copyright (c) Jan Dolejsi 2020. All rights reserved.
* Licensed under the MIT License. See License.txt in the project root for license information.
* ------------------------------------------------------------------------------------------ */
'use strict';

import { Plan, PlanStep, ProblemInfo } from "pddl-workspace";

/** Aligns action and object capitalization with the definitions in the domain and problem */

/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * Changes capitalization of the plan action names and object names to match the domain/problem.
 * This is assuming the case-insensitive PDDL treatment.
 * @param plan orig plan
 */
export function capitalize(plan: Plan): Plan {
    if (!plan.domain || !plan.problem) {
        return plan;
    }

    const actionNames = plan.domain.getActions().map(a => a.name ?? '');

    const capitalizedSteps = plan.steps
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map(step => capitalizeStep(step, actionNames, plan.problem!));

    const capitalizedPlan = new Plan(capitalizedSteps, plan.domain, plan.problem, plan.now, plan.helpfulActions);
    if (plan.isCostDefined()) {
        capitalizedPlan.cost = plan.cost;
    }
    return capitalizedPlan;
}

function capitalizeStep(step: PlanStep, actionNames: string[], problem: ProblemInfo): PlanStep {
    let changed = false;
    let changedActionName = step.getActionName();
    if (!actionNames.includes(step.getActionName())) {
        const matchingDomainAction = actionNames.find(name => name.toLowerCase() === step.getActionName().toLowerCase());
        if (matchingDomainAction) {
            changed = true;
            changedActionName = matchingDomainAction;
        }
    }

    const changedObjects = [];
    for (let i = 0; i < step.getObjects().length; i++) {
        const origObject = step.getObjects()[i];

        const matchingObject = problem.getObjectsTypeMap()
            .getTypeOf(origObject)?.getObjects()
            ?.find(o => o.toLowerCase() === origObject.toLowerCase());
        if (matchingObject) {
            changed = true;
            changedObjects[i] = matchingObject;
        } else {
            changedObjects[i] = origObject;
        }
    }

    if (changed) {
        let fullActionName = changedActionName;
        if (changedObjects.length) {
            fullActionName += ' ' + changedObjects.join(' ');
        }
        return new PlanStep(step.getStartTime(), fullActionName, step.isDurative, step.getDuration(), step.lineIndex, step.commitment, step.getIterations());
    }
    else {
        return step;
    }
}
