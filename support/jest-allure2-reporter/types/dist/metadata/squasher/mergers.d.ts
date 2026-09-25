import type { AllureTestFileMetadata, AllureTestCaseMetadata, AllureTestStepMetadata } from '@support/jest-allure2-reporter';
export declare function mergeTestFileMetadata(a: AllureTestFileMetadata, b: AllureTestFileMetadata | undefined): AllureTestFileMetadata;
export declare function mergeTestCaseMetadata(a: AllureTestCaseMetadata, b: AllureTestCaseMetadata | undefined): AllureTestCaseMetadata;
export declare function mergeTestStepMetadata(a: AllureTestStepMetadata, b: AllureTestStepMetadata | undefined): AllureTestStepMetadata;
