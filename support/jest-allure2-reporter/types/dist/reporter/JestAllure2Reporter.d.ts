import type { AggregatedResult, Config, ReporterOnStartOptions, Test, TestCaseResult, TestContext, TestResult } from '@jest/reporters';
import JestMetadataReporter from 'jest-metadata/reporter';
import type { ReporterOptions } from '@support/jest-allure2-reporter';
export declare class JestAllure2Reporter extends JestMetadataReporter {
    #private;
    private readonly _globalConfig;
    private readonly _options;
    private _globalContext;
    private _writer;
    private _config;
    private _globalMetadataProxy;
    private readonly _taskQueue;
    constructor(globalConfig: Config.GlobalConfig, options: ReporterOptions);
    onRunStart(aggregatedResult: AggregatedResult, options: ReporterOnStartOptions): Promise<void>;
    onTestFileStart(test: Test): Promise<void>;
    onTestCaseStart(test: Test, testCaseResult: TestCaseResult): void;
    onTestCaseResult(test: Test, testCaseResult: TestCaseResult): void;
    onTestFileResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult): Promise<void>;
    onRunComplete(testContexts: Set<TestContext>, aggregatedResult: AggregatedResult): Promise<void>;
}
