import type { AllureTestStepResult } from '@support/jest-allure2-reporter';
import type { Step as Serialized } from 'allure-store';
export declare function toTestStep(rootDirectory: string, step: AllureTestStepResult): Serialized;
