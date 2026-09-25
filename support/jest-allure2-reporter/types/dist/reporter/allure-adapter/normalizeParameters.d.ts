import type { AllureTestCaseResult, AllureTestStepResult } from '@support/jest-allure2-reporter';
export declare function normalizeParameters(result: AllureTestCaseResult | AllureTestStepResult): {
    value: string;
    name: string;
    excluded?: boolean;
    mode?: import("@support/jest-allure2-reporter").ParameterMode;
}[] | undefined;
