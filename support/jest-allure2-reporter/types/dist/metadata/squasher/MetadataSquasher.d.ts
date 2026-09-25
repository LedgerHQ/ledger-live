import type { Metadata, TestFileMetadata, TestInvocationMetadata } from 'jest-metadata';
import type { AllureNestedTestStepMetadata, AllureTestCaseMetadata, AllureTestFileMetadata } from '@support/jest-allure2-reporter';
import { MetadataSelector } from './MetadataSelector';
export declare class MetadataSquasher {
    protected readonly _fileSelector: MetadataSelector<Metadata, AllureTestFileMetadata>;
    protected readonly _testSelector: MetadataSelector<Metadata, AllureTestCaseMetadata>;
    protected readonly _stepSelector: MetadataSelector<Metadata, AllureNestedTestStepMetadata>;
    constructor();
    testFile(jest_metadata: TestFileMetadata): AllureTestFileMetadata;
    testInvocation(invocation: TestInvocationMetadata): AllureTestCaseMetadata;
}
