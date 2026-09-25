import type { AllureTestItemMetadata, TestStepExtractorContext } from '@support/jest-allure2-reporter';
import type { TestStepExtractor, TestStepsExtractor } from '../types';
type HasMetadata<Context, Key extends keyof Context> = Context & {
    [key in Key]: AllureTestItemMetadata;
};
export declare function testCaseSteps<BaseContext extends Partial<TestStepExtractorContext>, Key extends keyof BaseContext, Context extends HasMetadata<BaseContext, Key>>(testStep: TestStepExtractor<TestStepExtractorContext>, metadataKey: Key): TestStepsExtractor<Context, void>;
export {};
