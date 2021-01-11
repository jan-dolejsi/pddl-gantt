/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2021. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { expect } from 'chai';
import { Plan, PlanStep } from 'pddl-workspace';
import { JsonDomainVizConfiguration } from '../src';

describe("JsonDomainVizConfiguration", () => {
    describe("#shouldDisplay()", () => {
        it("absent configuration displays all actions", () => {
            // GIVEN
            const configurationInput = undefined;
            const planStep = new PlanStep(0, "a", false, undefined, undefined);

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldDisplay(planStep)).to.equal(true);
        });

        it("can specify exact action name", () => {
            // GIVEN
            const actionName = "a";
            const configurationInput = {
                "excludeActions": [
                    actionName
                ]
            };

            const matchingAction = new PlanStep(0, actionName, false, undefined, undefined);
            const anotherAction = new PlanStep(0, "b", false, undefined, undefined);

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldDisplay(matchingAction)).to.equal(false);
            expect(configuration.shouldDisplay(anotherAction)).to.equal(true);
        });

        it("can specify action name pattern", () => {
            // GIVEN
            const actionName = "aa";
            const configurationInput = {
                "excludeActions": [
                    "^" + actionName
                ]
            };

            const matchingAction = new PlanStep(0, actionName, false, undefined, undefined);
            const anotherAction = new PlanStep(0, "_" + actionName, false, undefined, undefined);

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldDisplay(matchingAction)).to.equal(false);
            expect(configuration.shouldDisplay(anotherAction)).to.equal(true);
        });
    });

    describe("#shouldIgnoreActionParameter()", () => {
        it("absent configuration displays all action parameters", () => {
            // GIVEN
            const configurationInput = undefined;

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldIgnoreActionParameter("a", "p")).to.equal(false);
        });

        it("can specify exact action and param name", () => {
            // GIVEN
            const actionName = "a";
            const paramName = "p";

            const configurationInput = {
                "ignoreActionParameters": [
                    {
                        "action": actionName,
                        "parameterPattern": paramName
                    }
                ]
            };

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldIgnoreActionParameter(actionName, paramName), `${actionName} ${paramName}`).to.equal(true);
            expect(configuration.shouldIgnoreActionParameter(actionName, "q"), `${actionName} q`).to.equal(false);
            expect(configuration.shouldIgnoreActionParameter("b", "q"), `b q`).to.equal(false);
        });

        it("can specify action and param name pattern", () => {
            // GIVEN
            const configurationInput = {
                "ignoreActionParameters": [
                    {
                        "action": "^_",
                        "parameterPattern": "to$"
                    }
                ]
            };

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.shouldIgnoreActionParameter("_action", "asdf_to")).to.equal(true);
            expect(configuration.shouldIgnoreActionParameter("_action", "to_not-matching")).to.equal(false);
            expect(configuration.shouldIgnoreActionParameter("not-matching", "to")).to.equal(false);
        });
    });

    describe("#getCustomVisualizationScriptPath()", () => {
        it("absent configuration returns undefined", () => {
            // GIVEN
            const configurationInput = undefined;

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.getCustomVisualizationScriptPath()).to.be.undefined;
        });

        it("can specify exact action and param name", () => {
            // GIVEN
            const script = "visualize.js";

            const configurationInput = {
                "customVisualization": script
            };

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(configuration.getCustomVisualizationScriptPath(), "custom viz script path").to.equal(script);
        });
    });

    describe("#getCustomVisualizationScript()", () => {
        it("absent configuration returns undefined script", async () => {
            // GIVEN
            const configurationInput = undefined;

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);
            const actual = await configuration.getCustomVisualizationScript();

            // THEN
            expect(actual).to.be.undefined;
        });

        it("configuration with absent custom visulization returns undefined script", async () => {
            // GIVEN
            const configurationInput = {};

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);
            const actual = await configuration.getCustomVisualizationScript();

            // THEN
            expect(actual).to.be.undefined;
        });

        it("configuration with custom visualization but undefined loader throws", async () => {
            const scriptPath = "//some/path/file.js";
            // GIVEN
            const configurationInput = {
                "customVisualization": scriptPath
            };

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);

            // THEN
            expect(await configuration.getCustomVisualizationScript()).to.throw;
        });

        it("can pass javascript", async () => {
            // GIVEN
            const script = "visualize.js";

            const configurationInput = {
                "customVisualization": script
            };

            const vizTable = "<table>";

            const scriptText = `  
            module.exports = {
                visualizeHtml: plan => "${vizTable}" 
            }
            `;

            // WHEN
            let scriptRequested: string | undefined;
            const configuration = new JsonDomainVizConfiguration(configurationInput, scriptPath => {
                scriptRequested = scriptPath;
                return scriptText;
            });

            // THEN
            expect(await configuration.getCustomVisualizationScript(), "custom viz script").to.equal(scriptText);
            expect(scriptRequested, "script requested").to.equal(script);
            const customVisualization = await configuration.getCustomVisualization();
            const actualViz = customVisualization?.visualizeHtml?.(new Plan([]), 100);
            expect(actualViz, "viz function output").equal(vizTable);
        });
    });

    describe("#getCustomVisualization()", () => {
        it("absent configuration returns undefined visualization", async () => {
            // GIVEN
            const configurationInput = undefined;

            // WHEN
            const configuration = new JsonDomainVizConfiguration(configurationInput);
            const actual = await configuration.getCustomVisualization();

            // THEN
            expect(actual).to.be.undefined;
        });
   
        it("can specify custom viz", async () => {
            // GIVEN
            const script = "visualize.js";

            const configurationInput = {
                "customVisualization": script
            };

            const mockVisualization = function visualizeHtml(plan: Plan, width: number): string {
                const height = 100;
                return `<svg height="${height}" width="${width}">
                    <rect width="${width}" height="${height}" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" />
                    <circle cx="${height/2}" cy="${height/2}" r="${plan.metric}" stroke="black" stroke-width="3" fill="red" />
                  </svg> `;
            }
    
            // WHEN
            let scriptRequested: string | undefined;
            const configuration = new JsonDomainVizConfiguration(configurationInput, undefined, {
                visualizeHtml: mockVisualization
            });

            // THEN
            expect(await configuration.getCustomVisualization(), "custom viz script").to.not.be.undefined;
            const customVisualization = await configuration.getCustomVisualization();
            const actualSvg = customVisualization?.visualizeHtml?.(new Plan([]), 300);
            expect(actualSvg, "actual svg").to.include("svg");
            expect(scriptRequested, "script requested").to.be.undefined;
        });
    });
});