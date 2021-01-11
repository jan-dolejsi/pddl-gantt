/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { PlanStep } from "pddl-workspace";
import { CustomVisualization } from "./CustomVisualization";
import { DomainVizConfiguration } from "./DomainVizConfiguration";
import { DomainVizConfigurationSchema } from "./DomainVizConfigurationSchema";

export class JsonDomainVizConfiguration implements DomainVizConfiguration {
    private customVisualizationScript: string | undefined;

    constructor(private readonly configuration?: DomainVizConfigurationSchema,
        private readonly customVisualizationScriptLoader?: (path: string) => string | Promise<string>,
        private customVisualization?: CustomVisualization) {
    }

    public static withCustomVisualizationScript(configuration?: DomainVizConfigurationSchema,
        customDomainVisualizationScript?: string): JsonDomainVizConfiguration {
        
        // set up the script loader callback, if the script is provided
        let customDomainVisualizationScriptLoader: undefined | (() => string);
        if (customDomainVisualizationScript !== undefined) {
            customDomainVisualizationScriptLoader = (): string => customDomainVisualizationScript;
        } else {
            customDomainVisualizationScriptLoader = undefined;
        }        
        
        return new JsonDomainVizConfiguration(configuration, customDomainVisualizationScriptLoader);
    }

    public static withCustomVisualization(configuration: DomainVizConfigurationSchema | undefined,
        customDomainVisualization: CustomVisualization): JsonDomainVizConfiguration {
        return new JsonDomainVizConfiguration(configuration, undefined, customDomainVisualization);
    }

    shouldDisplay(planStep: PlanStep): boolean {
        return !this.configuration?.excludeActions
            ?.some(pattern => this.matches(pattern, planStep.getActionName())) ?? true;
    }

    shouldIgnoreActionParameter(actionName: string, parameterName: string): boolean {
        const applicableSetting = this.configuration?.ignoreActionParameters
            ?.find(entry => this.matches(entry.action, actionName));

        if (!applicableSetting) { return false; }

        return parameterName.match(new RegExp(applicableSetting.parameterPattern, "i")) !== null;
    }

    private matches(pattern: string, actionName: string): boolean {
        return !!actionName.match(new RegExp(pattern, "i"));
    }

    getCustomVisualizationScriptPath(): string | undefined {
        return this.configuration?.customVisualization;
    }

    async getCustomVisualizationScript(): Promise<string | undefined> {
        if (this.customVisualizationScript !== undefined) {
            return this.customVisualizationScript;
        } else if (this.configuration?.customVisualization && this.customVisualizationScriptLoader) {
            return this.customVisualizationScript = await this.customVisualizationScriptLoader(this.configuration?.customVisualization);
        } else {
            return undefined;
        }
    }

    async getCustomVisualization(): Promise<CustomVisualization | undefined> {
        if (this.customVisualization) {
            return this.customVisualization;
        } else {
            const script = await this.getCustomVisualizationScript();
            if (script !== undefined) {
                return this.customVisualization = eval(script);
            }
        }

        return undefined;
    }
}
