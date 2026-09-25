import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import type { Container as AllureContainer } from 'allure-store';
export type TestContainerOptions = {
    name: string;
    rootDir: string;
    testUUID: string;
};
export declare function toTestContainer(test: AllureTestCaseResult, options: TestContainerOptions): AllureContainer;
