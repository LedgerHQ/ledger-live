import type { AllureTestCaseResult, AllureTestStepResult, AttachmentsOptions, Category, ExecutorInfo, GlobalExtractorContext, Helpers, PropertyExtractor, TestCaseExtractorContext, TestFileExtractorContext, TestRunExtractorContext, Primitive, PromisedProperties, MaybePromise, TestStepExtractorContext, SourceCodePluginCustomizer, SourceCodePlugin } from '@support/jest-allure2-reporter';
export type CompositeExtractorLoose<Context, Shape> = {
    readonly [K in keyof Shape]-?: null | PropertyExtractor<Context, MaybePromise<Shape[K]>>;
};
export type CompositeExtractor<Context, Shape> = {
    readonly [K in keyof Shape]-?: PropertyExtractor<Context, MaybePromise<Shape[K]>>;
};
export interface ReporterConfig<O = never> {
    overwrite: boolean;
    resultsDir: string;
    injectGlobals: boolean;
    attachments: Required<AttachmentsOptions>;
    sourceCode: SourceCodeProcessorConfig;
    categories: CategoriesExtractor<O>;
    environment: EnvironmentExtractor<O>;
    executor: ExecutorExtractor<O>;
    helpers: HelpersExtractor<O>;
    testCase: TestCaseExtractor<TestCaseExtractorContext, O>;
    testFile: TestCaseExtractor<TestFileExtractorContext, O>;
    testRun: TestCaseExtractor<TestRunExtractorContext, O>;
    testStep: TestStepExtractor<TestStepExtractorContext, O>;
    writer: string | Function | object | [string | Function, unknown];
}
export interface SourceCodeProcessorConfig {
    enabled: boolean;
    factories: Record<string, SourceCodePluginCustomizer>;
    options: Record<string, unknown>;
    plugins: SourceCodePlugin[];
}
export type ExecutorExtractor<T = never> = PropertyExtractor<GlobalExtractorContext, MaybePromise<ExecutorInfo> | T, MaybePromise<ExecutorInfo>>;
export type HelpersExtractor<T = never> = PropertyExtractor<GlobalExtractorContext, PromisedProperties<Helpers> | T, PromisedProperties<Helpers>>;
export type CategoriesExtractor<T = never> = PropertyExtractor<GlobalExtractorContext, MaybePromise<Category[]> | T, MaybePromise<Category[]>>;
export type EnvironmentExtractor<T = never> = PropertyExtractor<GlobalExtractorContext, MaybePromise<Record<string, Primitive>> | T, MaybePromise<Record<string, Primitive>>>;
export type TestCaseExtractor<Context, T = never> = PropertyExtractor<Context, PromisedProperties<AllureTestCaseResult> | T, PromisedProperties<AllureTestCaseResult>>;
export type TestStepExtractor<Context, T = never> = PropertyExtractor<Context, PromisedProperties<AllureTestStepResult> | T, PromisedProperties<AllureTestStepResult>>;
export type TestStepsExtractor<Context, T = never> = PropertyExtractor<Context, PromisedProperties<AllureTestStepResult>[] | T, PromisedProperties<AllureTestStepResult>[] | undefined>;
export type TestCaseCompositeExtractor<Context> = CompositeExtractorLoose<Context, AllureTestCaseResult>;
export type TestStepCompositeExtractor<Context> = CompositeExtractorLoose<Context, AllureTestStepResult>;
