import type { AllureTestStepMetadata, AllureTestCaseMetadata, AllureTestItemDocblock } from '@support/jest-allure2-reporter';
export declare function mapTestStepDocblock({ comments, pragmas, }: AllureTestItemDocblock): AllureTestStepMetadata;
export declare function mapTestCaseDocblock(context: AllureTestItemDocblock): AllureTestCaseMetadata;
export declare const mapTestFileDocblock: typeof mapTestCaseDocblock;
