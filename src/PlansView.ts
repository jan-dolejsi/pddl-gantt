/* --------------------------------------------------------------------------------------------
 * Copyright (c) Jan Dolejsi 2020. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Plan } from "pddl-workspace";
import { appendPlanView, ATTR_PLAN, DIGITS, getHostElement, PlanView, PlanViewOptions, px, View } from "./PlanView";
import { DomainVizConfiguration } from "./DomainVizConfiguration";

const PLAN_SELECTORS = "planSelectors";
const PLAN_SELECTOR = "planSelector";
const PLAN_SELECTOR_SELECTED = PLAN_SELECTOR + "-selected";
const PLAN_VIEWS = "planViews";

export interface PlansViewOptions extends PlanViewOptions {
    onPlanSelected?: (planIndex: number) => void;
}

/** Multiple-plan view. */
export class PlansView extends View {
    private selectedPlan = -1;
    private plans: Plan[] = [];
    private planViewsEl: HTMLDivElement | undefined;
    private planViews: PlanView[] = [];
    private readonly onPlanSelected?: (planIndex: number) => void;

    constructor(hostElement: HTMLDivElement, options: PlansViewOptions) {
        super(hostElement, options);
        this.onPlanSelected = options.onPlanSelected;
        this.clear();
    }

    clear(): void {
        this.showPlans([], -1);
    }

    /**
     * Get `PlanView` for the plan at given `planIndex`
     * @param planIndex plan index
     * @throws when planIndex is out of range
     */
    getView(planIndex: number): PlanView {
        return this.planViews[planIndex];
    }

    showPlans(plans: Plan[], planId = -1, configuration?: DomainVizConfiguration): void {
        this.selectedPlan = planId < 0 ? plans.length - 1 : planId;
        this.plans = plans;
        this.planViews = [];

        this.createPlanSelectors();
        this.createPlanViews(configuration);
    }

    addPlan(plan: Plan, configuration?: DomainVizConfiguration): void {
        const planIndex = this.plans.push(plan) - 1;
        this.createPlanSelectors();
        this.planViewsEl && this.addPlanView(plan, planIndex, this.planViewsEl, configuration);
    }

    private setSelectedPlan(newSelectedPlan: number): void {
        if (this.selectedPlan != newSelectedPlan) {
            // remember the index of the plan that is being shown for later manipulation
            this.selectedPlan = newSelectedPlan;
            this.onPlanSelected?.(this.selectedPlan);
        }
    }
    
    private createPlanSelectors(): void {
        const planSelectorsEl = this.getOrCreateBlankChildElement(PLAN_SELECTORS);

        planSelectorsEl.style.display = this.plans.length > 1 ? "flex" : "none";

        const maxMetric = Math.max(...this.plans.map(plan => plan.metric ?? 0));

        this.plans.forEach((plan, planIndex) =>
            this.createPlanSelector(plan, planIndex, this.selectedPlan, maxMetric, planSelectorsEl));

        this.scrollPlanSelectorIntoView(this.selectedPlan);
    }

    private createPlanSelector(plan: Plan, planIndex: number, selectedPlan: number, maxMetric: number, parentEl: HTMLDivElement): void {

        const normalizedMetric = (plan.metric ?? 0) / maxMetric * 100;
        const costRounded = plan.metric !== undefined ? plan.metric.toFixed(DIGITS) : NaN.toString();
        const tooltip = `Plan #${planIndex}
Metric value / cost: ${plan.metric}
Makespan: ${plan.makespan}
States evaluated: ${plan.statesEvaluated}`;

        const planSelectorEl = document.createElement('div');
        planSelectorEl.className = PLAN_SELECTOR;
        if (planIndex === selectedPlan) {
            planSelectorEl.classList.add(PLAN_SELECTOR_SELECTED);
        }

        planSelectorEl.setAttribute(ATTR_PLAN, planIndex.toString());
        planSelectorEl.onclick = (): void => this.showSelectedPlan(planIndex);

        const label = document.createElement("span");
        label.innerText = costRounded;
        planSelectorEl.appendChild(label);

        const bar = document.createElement("div");
        bar.className = "planMetricBar";
        bar.style.height = px(normalizedMetric);
        bar.title = tooltip;
        planSelectorEl.appendChild(bar);

        parentEl.appendChild(planSelectorEl);
    }

    private createPlanViews(configuration?: DomainVizConfiguration): void {
        const planViesEl = this.planViewsEl = this.getOrCreateBlankChildElement(PLAN_VIEWS);

        this.plans.forEach((plan, planIndex) => this.addPlanView(plan, planIndex, planViesEl, configuration));
    }

    private addPlanView(plan: Plan, planIndex: number, parent: HTMLDivElement, configuration?: DomainVizConfiguration): void {
        const newPlanView = appendPlanView(parent, planIndex, this.options);
        newPlanView.showPlan(plan, configuration);
        this.showSelectedPlan(planIndex);
        this.planViews[planIndex] = newPlanView;
    }

    showSelectedPlan(selectedPlanIndex: number): void {
        this.setSelectedPlan(selectedPlanIndex);
        this.planViews.forEach(planView => {
            planView.setVisible(planView.planIndex === selectedPlanIndex);
        });

        document.querySelectorAll("div." + PLAN_SELECTOR).forEach(div => {
            const planIdAsStr = div.getAttribute(ATTR_PLAN);
            if (planIdAsStr !== null) {
                const planId = parseInt(planIdAsStr);
                if (selectedPlanIndex === planId) {
                    div.classList.add(PLAN_SELECTOR_SELECTED);
                } else {
                    div.classList.remove(PLAN_SELECTOR_SELECTED);
                }
            } else {
                console.warn(`planSelector element does not have the 'plan' attribute`);
            }
        });
    }

    /**
     * Ensures the plan selector with the given index is visible by scrolling the plan selectors div.
     * @param planIndex plan selector to scroll to
     */
    scrollPlanSelectorIntoView(planIndex: number): void {
        document.querySelectorAll('div.' + PLAN_SELECTOR).forEach(div => {
            if (parseInt(div.getAttribute(ATTR_PLAN) ?? "-1") === planIndex) {
                div.scrollIntoView();
            }
        });
    }

}

export function createPlansView(hostElementId: string,
    options: PlansViewOptions): PlansView {

    const hostElement = getHostElement(hostElementId) as HTMLDivElement;

    return new PlansView(hostElement, options);
}
