import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import type { AllureWriter } from 'allure-store';
type CreateTestArguments = {
    resultsDir: string;
    writer: AllureWriter;
    containerName: string;
    test: AllureTestCaseResult;
};
export declare function writeTest({ resultsDir, writer, test, containerName }: CreateTestArguments): Promise<void>;
export {};
