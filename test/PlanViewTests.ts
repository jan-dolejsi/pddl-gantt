import { expect } from 'chai';
import { before } from 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import { PlanView } from '../src/PlanView';
import { JsonDomainVizConfiguration } from '../src/JsonDomainVizConfiguration';
import { DomainInfo, parser, PlanStep } from "pddl-workspace";

describe("PlanView", () => {

    let domain: DomainInfo | undefined;
    // let problem: ProblemInfo | undefined;
    // let planInfo: PlanInfo | undefined;

    // const EPSILON = 1e-3;

    before(async () => {
        const testDir = path.join(__dirname, "..", "..", "test")
        const domainText = fs.readFileSync(path.join(testDir, "domain.pddl"));
        // const problemText = fs.readFileSync(path.join(testDir, "problem.pddl"));
        // const planText = fs.readFileSync(path.join(testDir, "plan.pddl"));
    
        domain = parser.PddlDomainParser.parseText(domainText.toString());
        // problem = await parser.PddlProblemParser.parseText(problemText.toString());
        
        // planInfo = parser.PddlPlanParser.parseText(planText.toString(), EPSILON);
    });

    describe("#shouldDisplayObject()", () => {
        // GIVEN
        // 1.0020: (drive-truck truck1 s0 s2 driver1)  [10.0000]
        const planStep = new PlanStep(1.002, "DRIVE-TRUCK truck1 s0 s2 driver1", true, 10, 1);

        it("should show DRIVE action in truck1 lane", () => {

            const actual = PlanView.shouldDisplayObject(planStep, "truck1", domain, /*settings*/undefined);
            expect(actual).to.equal(true);
        });

        it("should show DRIVE action in s0 lane", () => {

            const actual = PlanView.shouldDisplayObject(planStep, "s0", domain, /*settings*/undefined);
            expect(actual).to.equal(true);
        });

        it("should show DRIVE action in s2 lane", () => {

            const actual = PlanView.shouldDisplayObject(planStep, "s2", domain, /*settings*/undefined);
            expect(actual).to.equal(true);
        });

        it("should NOT show DRIVE action in ?loc-to lane, which is configured to be excluded", () => {
            const settings = JSON.parse(`{
                "ignoreActionParameters": [{
                    "action": "DRIVE-TRUCK",
                    "parameterPattern": "loc-to"
                }]
            }`);
            const actual = PlanView.shouldDisplayObject(planStep, "s2", domain, new JsonDomainVizConfiguration(settings));
            expect(actual).to.equal(false);
        });

        it("should show DRIVE action in driver1 lane", () => {

            const actual = PlanView.shouldDisplayObject(planStep, "driver1", domain, /*settings*/undefined);
            expect(actual).to.equal(true);
        });
        
        it("should show UNKNOWN action in the right lane", () => {

            const unknownStep = new PlanStep(1.002, "UNKNOWN obj1", true, 10, 1);

            const actualObj1 = PlanView.shouldDisplayObject(unknownStep, "obj1", /*domain*/undefined, /*settings*/undefined);
            expect(actualObj1).to.equal(true);

            const actual = PlanView.shouldDisplayObject(unknownStep, "unknownObject", /*domain*/undefined, /*settings*/undefined);
            expect(actual).to.equal(false);
        });

    });
});