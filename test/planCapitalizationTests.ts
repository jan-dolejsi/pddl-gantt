import { expect } from 'chai';
import { PlanStep, ProblemInfo, SimpleDocumentPositionResolver, TypeObjectMap } from 'pddl-workspace';
import { PddlSyntaxTree } from 'pddl-workspace/dist/parser';
import { URI } from 'vscode-uri';
import { capitalizeStep } from '../src/planCapitalization';

describe("planCapitalization", () => {
    describe("#capitalizeStep()", () => {
        it("capitalizes non-matching action name", () => {
            // GIVEN
            const problem = new ProblemInfo(URI.parse("//file"), 0, "problemName", "domainName", PddlSyntaxTree.EMPTY, new SimpleDocumentPositionResolver(""));
            const existingActionName = "action1";
            const nonExistingActionName = "aCTIon1";
            const planStep = new PlanStep(1, nonExistingActionName, false, undefined, undefined);

            // WHEN
            const actual = capitalizeStep(planStep, [existingActionName], problem);

            // THEN
            expect(actual.getActionName()).to.equal(existingActionName);
            expect(actual.getObjects()).has.lengthOf(0, "number of action objects");
        });

        it("does not capitalize matching action name", () => {
            // GIVEN
            const problem = new ProblemInfo(URI.parse("//file"), 0, "problemName", "domainName", PddlSyntaxTree.EMPTY, new SimpleDocumentPositionResolver(""));
            const allCapsActionName = "ACTION1";
            const existingActionName = "action1";
            const planStep = new PlanStep(1, existingActionName, false, undefined, undefined);

            // WHEN
            const actual = capitalizeStep(planStep, [allCapsActionName, existingActionName], problem);

            // THEN
            expect(actual.getActionName()).to.equal(existingActionName, "action name should remain unchanged");
            expect(actual.getObjects()).has.lengthOf(0, "number of action objects");
        });

        it("does not capitalize unexpected action name", () => {
            // GIVEN
            const problem = new ProblemInfo(URI.parse("//file"), 0, "problemName", "domainName", PddlSyntaxTree.EMPTY, new SimpleDocumentPositionResolver(""));
            const existingActionName = "action1";
            const planStep = new PlanStep(1, existingActionName, false, undefined, undefined);

            // WHEN
            const actual = capitalizeStep(planStep, [/* intentionally blank */], problem);

            // THEN
            expect(actual.getActionName()).to.equal(existingActionName, "action name should remain unchanged");
            expect(actual.getObjects()).has.lengthOf(0, "number of action objects");
        });

        it("capitalizes non-matching object", () => {
            // GIVEN
            const problem = new ProblemInfo(URI.parse("//file"), 0, "problemName", "domainName", PddlSyntaxTree.EMPTY, new SimpleDocumentPositionResolver(""));
            const existingObject = "object1";
            const nonExistingObject = "OBJECT1";
            const objectMap = new TypeObjectMap().add("type1", existingObject);
            problem.setObjects(objectMap);
            const actionName = "action1";
            const planStep = new PlanStep(1, `${actionName} ${nonExistingObject}`, false, undefined, undefined);

            // WHEN
            const actual = capitalizeStep(planStep, [actionName], problem);

            // THEN
            expect(actual.getActionName()).to.equal(actionName);
            expect(actual.getObjects()).has.lengthOf(1, "number of action objects");
            expect(actual.getObjects()[0]).to.equal(existingObject);
        });

        it("does not capitalize object that exist in the problem", () => {
            // GIVEN
            const problem = new ProblemInfo(URI.parse("//file"), 0, "problemName", "domainName", PddlSyntaxTree.EMPTY, new SimpleDocumentPositionResolver(""));
            const allCapsObject = "OBJECT1";
            const existingObject = "object1";
            const objectMap = new TypeObjectMap().addAll("type1", [allCapsObject, existingObject]);
            problem.setObjects(objectMap);
            const actionName = "action1";
            const planStep = new PlanStep(1, `${actionName} ${existingObject}`, false, undefined, undefined);

            // WHEN
            const actual = capitalizeStep(planStep, [actionName], problem);

            // THEN
            expect(actual.getActionName()).to.equal(actionName);
            expect(actual.getObjects()).has.lengthOf(1, "number of action objects");
            expect(actual.getObjects()[0]).to.equal(existingObject);
        });
    });
});