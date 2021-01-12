/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2021. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Plan } from "pddl-workspace";

/** 
 * Interface for objects to be returned by custom plan visualization scripts. 
 * The implementations should initialize _one_ of the visualizeXyz methods.
 * If more then one visualization method is implemented, the framework will
 * use the first one (in order of declaration in this interface).
 */
export interface CustomVisualization {
    
    /**
     * Generates HTML text for the `plan` that will be inserted to the page.
     * @param plan plan to be visualized
     * @param displayWidth desired width in pixels
     */
    visualizePlanHtml?(plan: Plan, displayWidth: number): string;

    /**
     * Populates the `planVizDiv` element with the plan visualization.
     * @param planVizDiv host element on the page
     * @param plan plan to be visualized
     * @param displayWidth desired width in pixels
     */
    visualizePlanInDiv?(planVizDiv: HTMLDivElement, plan: Plan, displayWidth: number): void;

    /**
     * Creates an SVG object representing the given `plan`, which will be inserted into the host element on the page.
     * @param plan plan to be visualized
     * @param displayWidth desired width in pixels
     */
    visualizePlanSvg?(plan: Plan, displayWidth: number): SVGElement;
}