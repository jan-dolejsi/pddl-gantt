/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { PlanStep } from "pddl-workspace";
import { PlanVizSettings } from "./PlanVizSettings";

export class JsonPlanVizSettings implements PlanVizSettings {
    excludeActions: string[] | undefined;
    ignoreActionParameters: ActionParameterPattern[] | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private readonly settings: any, private readonly planVisualizationScript?: string) {
    }

    shouldDisplay(planStep: PlanStep): boolean {
        if (!this.settings) { return true; }

        if (this.excludeActions === undefined) {
            this.excludeActions = this.settings["excludeActions"];
        }

        if (!this.excludeActions) { return true; }
        return !this.excludeActions.some(pattern => this.matches(pattern, planStep.getActionName()));
    }

    shouldIgnoreActionParameter(actionName: string, parameterName: string): boolean {
        if (!this.settings) { return false; }

        if (this.ignoreActionParameters === undefined) { this.ignoreActionParameters = this.settings["ignoreActionParameters"]; }
        if (!this.ignoreActionParameters) { return false; }

        const applicableSetting = this.ignoreActionParameters.find(entry => this.matches(entry.action, actionName));

        if (!applicableSetting) { return false; }

        return parameterName.match(new RegExp(applicableSetting.parameterPattern, "i")) !== null;
    }

    private matches(pattern: string, actionName: string): boolean {
        return !!actionName.match(new RegExp(pattern, "i"));
    }

    getPlanVisualizationScriptPath(): string {
        return this.settings && this.settings["planVisualizer"];
    }

    getPlanVisualizationScript(): string | undefined {
        return this.planVisualizationScript;
    }
}

interface ActionParameterPattern {
    action: string;
    parameterPattern: string;
}

interface DomainVizSchema {
    /**
     * Regex expression for actions that should be entirely hidden from the plan visualization. E.g.:
     * "action-to-be-hidden",
     * "^prefix_",
     * "suffix$"        
     */
    excludeActions: string[];
    /** Regex expression for parameters of selected actions to be hidden from the plan visualization. */
    ignoreActionParameters: IgnoreActionParametersSchema[];
}

/**
 * Regex expression for parameters of selected actions to be hidden from the plan visualization.
 * {
 *   "action": "^move",
 *   "parameterPattern": "^(to|from)$"
 * }
 */
interface IgnoreActionParametersSchema {
    action: string;
    parameterPattern: string;
}