import type { TestCaseExtractor, TestStepsExtractor } from './types';
export declare function combineTestCaseAndSteps<Context>(testCase: TestCaseExtractor<Context>, testSteps: TestStepsExtractor<Context>): TestCaseExtractor<Context, void>;
