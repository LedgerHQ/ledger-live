import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import type { Result as Serialized } from 'allure-store';
export declare function toTestResult(rootDirectory: string, test: AllureTestCaseResult): Serialized;
