/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2021. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';


/** Schema for JSON files/documents holding domain-specific plan/state visualization instructions. */
export interface DomainVizConfigurationSchema {
    /**
     * Regex expression for actions that should be entirely hidden from the plan visualization. E.g.:
     * "action-to-be-hidden",
     * "^prefix_",
     * "suffix$"        
     */
    excludeActions?: string[];

    /** Regex expression for parameters of selected actions to be hidden from the plan visualization. */
    ignoreActionParameters?: ActionParameterPattern[];

    /** Relative (to the domain file) path of plan/state visualization */
    customVisualization?: string;
}

/**
 * Regex expression for parameters of selected actions to be hidden from the plan visualization.
 * {
 *   "action": "^move",
 *   "parameterPattern": "^(to|from)$"
 * }
 */
export interface ActionParameterPattern {

    /** Regular expression to match action name. */
    action: string;

    /** Regular expression to match parameter name - parameter to be ignored when selecting actions for object swimlanes. */
    parameterPattern: string;
}