/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { PlanStep } from "pddl-workspace";

export interface PlanVizSettings {
    shouldDisplay(planStep: PlanStep): boolean;
    shouldIgnoreActionParameter(actionName: string, parameterName: string): boolean;
    getPlanVisualizerScript(): string;
}