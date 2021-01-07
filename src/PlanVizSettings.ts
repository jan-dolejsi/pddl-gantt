/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { PlanStep } from "pddl-workspace";

export interface PlanVizSettings {

    /**
     * Decides whether given plan step shall be visualized.
     * @param planStep plan step
     */
    shouldDisplay(planStep: PlanStep): boolean;

    /**
     * Decides, whether objects should be hidden from swim-lanes based on the action/parameters they are involved in.
     * @param actionName action name e.g. 'drive'
     * @param parameterName action parameter name e.g. 'from'
     */
    shouldIgnoreActionParameter(actionName: string, parameterName: string): boolean;
    
    /** @returns JavaScript source to evaluate */
    getPlanVisualizationScript(): string | undefined;

    /** @returns path to JavaScript file to load and execute */
    getPlanVisualizationScriptPath(): string | undefined;
}