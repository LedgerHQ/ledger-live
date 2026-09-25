import path from 'node:path';

import type {
  AggregatedResult,
  Config,
  ReporterOnStartOptions,
  Test,
  TestCaseResult,
  TestContext,
  TestResult,
} from '@jest/reporters';
import type { TestInvocationMetadata } from 'jest-metadata';
import JestMetadataReporter from 'jest-metadata/reporter';
import type {
  AllureTestCaseMetadata,
  AllureTestFileMetadata,
  AllureTestRunMetadata,
  GlobalExtractorContext,
  Helpers,
  PropertyExtractorContext,
  ReporterOptions,
  TestCaseExtractorContext,
  TestFileExtractorContext,
  TestRunExtractorContext,
} from '@support/jest-allure2-reporter';
import { type AllureWriter } from 'allure-store';

import { type ReporterConfig, resolveOptions, resolveWriter } from '../options';
import { AllureMetadataProxy, MetadataSquasher } from '../metadata';
import {
  compactArray,
  DeferredTaskQueue,
  FileNavigatorCache,
  memoize,
  stringifyValues,
} from '../utils';
import { log, optimizeForTracing } from '../logger';

import * as fallbacks from './fallbacks';
import { postProcessMetadata } from './postProcessMetadata';
import { writeTest } from './allureCommons';
import { resolvePromisedItem, resolvePromisedTestCase } from './resolveTestItem';

const NOT_INITIALIZED = null as any;

const __TID = optimizeForTracing((test?: Test) => ({
  tid: ['@support/jest-allure2-reporter', test ? test.path : 'run'],
}));

const __TID_NAME = optimizeForTracing((test: Test, testCaseResult: TestCaseResult) => ({
  tid: ['@support/jest-allure2-reporter', test.path],
  fullName: testCaseResult.fullName,
}));

interface QueuedTestResult {
  test: Test;
  testCaseResult: TestCaseResult;
  testInvocationMetadata: TestInvocationMetadata;
}

export class JestAllure2Reporter extends JestMetadataReporter {
  private readonly _globalConfig: Config.GlobalConfig;
  private readonly _options: ReporterOptions;
  private _globalContext: GlobalExtractorContext = NOT_INITIALIZED;
  private _writer: AllureWriter = NOT_INITIALIZED;
  private _config: ReporterConfig<void> = NOT_INITIALIZED;
  private _globalMetadataProxy: AllureMetadataProxy<AllureTestRunMetadata> = NOT_INITIALIZED;
  private readonly _taskQueue = new DeferredTaskQueue<QueuedTestResult, TestInvocationMetadata>({
    getThreadName: (item) => item.test.path,
    getPayloadKey: (item) => item.testInvocationMetadata,
    execute: (item) =>
      log.trace.complete(
        __TID_NAME(item.test, item.testCaseResult),
        item.testCaseResult.title,
        () => this.#writeTestResult(item),
      ),
  });

  constructor(globalConfig: Config.GlobalConfig, options: ReporterOptions) {
    super(globalConfig);

    this._globalConfig = globalConfig;
    this._options = options;
  }

  async #init() {
    this._config = await resolveOptions(this._globalConfig.rootDir, this._options);
    this._writer = await resolveWriter(this._globalConfig.rootDir, this._config);

    await this._writer.init?.();

    const testRunMetadata = JestAllure2Reporter.query.globalMetadata();
    this._globalMetadataProxy = new AllureMetadataProxy<AllureTestRunMetadata>(testRunMetadata);
    this._globalMetadataProxy.set('config', {
      resultsDir: this._config.resultsDir,
      overwrite: this._config.overwrite,
      attachments: this._config.attachments,
      injectGlobals: this._config.injectGlobals,
    });
  }

  async #attempt(name: string, function_: () => unknown) {
    try {
      await function_.call(this);
    } catch (error: unknown) {
      log.error(error, `Caught unhandled error in JestAllure2Reporter#${name}`);
    }
  }

  async #attemptSync(name: string, function_: () => unknown) {
    try {
      function_.call(this);
    } catch (error: unknown) {
      log.error(error, `Caught unhandled error in JestAllure2Reporter#${name}`);
    }
  }

  async onRunStart(
    aggregatedResult: AggregatedResult,
    options: ReporterOnStartOptions,
  ): Promise<void> {
    await super.onRunStart(aggregatedResult, options);
    const attemptRunStart = this.#attempt.bind(this, 'onRunStart()', this.#onRunStart);

    log.trace.begin(__TID(), '@support/jest-allure2-reporter');
    await log.trace.complete(__TID(), 'init', this.#init.bind(this));
    await log.trace.complete(__TID(), 'onRunStart', attemptRunStart);
  }

  async #onRunStart() {
    const reporterConfig = this._config;
    const allureWriter = this._writer;

    const globalContext = {
      $: {} as Helpers,
      globalConfig: this._globalConfig,
      reporterConfig,
      value: undefined,
    };

    globalContext.$ = await resolvePromisedItem(globalContext, reporterConfig.helpers, '$');

    if (reporterConfig.sourceCode.enabled) {
      const { factories, options, plugins } = reporterConfig.sourceCode;
      const maybePlugins = await Promise.all(
        Object.entries(factories).map(async ([key, factory]) =>
          factory({
            ...globalContext,
            value: options[key],
          }),
        ),
      );

      plugins.push(...compactArray(maybePlugins));
    }

    this._globalContext = globalContext;

    const environment = await reporterConfig.environment(globalContext);
    if (environment) {
      await allureWriter.writeEnvironmentInfo(stringifyValues(environment));
    }

    const executor = await reporterConfig.executor(globalContext);
    if (executor) {
      await allureWriter.writeExecutorInfo(executor);
    }

    const categories = await reporterConfig.categories(globalContext);
    if (categories) {
      await allureWriter.writeCategories(categories);
    }
  }

  async onTestFileStart(test: Test) {
    super.onTestFileStart(test);

    const execute = this.#onTestFileStart.bind(this, test);
    const attempt = this.#attemptSync.bind(this, 'onTestFileStart()', execute);
    const testPath = path.relative(this._globalConfig.rootDir, test.path);
    log.trace.begin(__TID(test), testPath);
    await log.trace.complete(__TID(test), 'onTestFileStart', attempt);
  }

  async #onTestFileStart(test: Test) {
    await FileNavigatorCache.instance.scanSourcemap(test.path);

    const rawMetadata = JestAllure2Reporter.query.test(test);
    const testFileMetadata = new AllureMetadataProxy<AllureTestFileMetadata>(rawMetadata);

    fallbacks.onTestFileStart(test, testFileMetadata);
  }

  onTestCaseStart(test: Test, testCaseResult: TestCaseResult) {
    super.onTestCaseStart(test, testCaseResult);
    this._taskQueue.startPending(test.path);
  }

  onTestCaseResult(test: Test, testCaseResult: TestCaseResult) {
    super.onTestCaseResult(test, testCaseResult);

    const testEntryMetadata = JestAllure2Reporter.query.testCaseResult(testCaseResult);
    const testInvocationMetadata = testEntryMetadata.lastInvocation!;
    fallbacks.onTestCaseResult(
      test,
      testCaseResult,
      new AllureMetadataProxy<AllureTestCaseMetadata>(testInvocationMetadata),
    );

    this._taskQueue.enqueue({
      test,
      testCaseResult,
      testInvocationMetadata,
    });
  }

  async #writeTestResult({ test, testCaseResult, testInvocationMetadata }: QueuedTestResult) {
    await this.#scanSourceMaps(test.path);
    await postProcessMetadata(this._globalContext, testInvocationMetadata);

    const squasher = new MetadataSquasher();
    const testCaseContext: PropertyExtractorContext<TestCaseExtractorContext, void> = {
      ...this._globalContext,
      filePath: path.relative(this._globalConfig.rootDir, test.path).split(path.sep),
      result: {},
      testCase: testCaseResult,
      testCaseMetadata: squasher.testInvocation(testInvocationMetadata),
      testFileMetadata: squasher.testFile(testInvocationMetadata.file),
      testRunMetadata: this._globalMetadataProxy.get(),
      value: undefined,
    };

    const allureTest = await resolvePromisedTestCase(testCaseContext, this._config.testCase);
    if (!allureTest) {
      return;
    }

    const invocationIndex =
      testInvocationMetadata.definition.invocations.indexOf(testInvocationMetadata);

    await writeTest({
      resultsDir: this._config.resultsDir,
      containerName: `${testCaseResult.fullName} (${invocationIndex})`,
      writer: this._writer,
      test: allureTest,
    });
  }

  async onTestFileResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
    super.onTestFileResult(test, testResult, aggregatedResult);

    const execute = this.#onTestFileResult.bind(this, test, testResult);
    const attempt = this.#attempt.bind(this, 'onTestFileResult()', execute);
    await log.trace.complete(__TID(test), 'onTestFileResult', attempt);
    log.trace.end(__TID(test));
  }

  async #onTestFileResult(test: Test, testResult: TestResult) {
    const rawMetadata = JestAllure2Reporter.query.test(test);
    const testFileMetadata = new AllureMetadataProxy<AllureTestFileMetadata>(rawMetadata);
    fallbacks.onTestFileResult(test, testFileMetadata);

    for (const testCaseResult of testResult.testResults) {
      const invocations =
        JestAllure2Reporter.query.testCaseResult(testCaseResult).invocations || [];

      for (const testInvocationMetadata of invocations) {
        this._taskQueue.enqueue({
          test,
          testCaseResult,
          testInvocationMetadata,
        });
      }
    }

    await this._taskQueue.awaitCompletion();

    const config = this._config;
    const squasher = new MetadataSquasher();
    const globalMetadataProxy = this._globalMetadataProxy;

    const testFileContext: PropertyExtractorContext<TestFileExtractorContext, void> = {
      ...this._globalContext,
      filePath: path.relative(this._globalConfig.rootDir, testResult.testFilePath).split(path.sep),
      result: {},
      testFile: testResult,
      testFileMetadata: squasher.testFile(JestAllure2Reporter.query.testResult(testResult)),
      testRunMetadata: globalMetadataProxy.get(),
      value: undefined,
    };

    const allureFileTest = await resolvePromisedTestCase(testFileContext, config.testFile);
    if (allureFileTest) {
      await writeTest({
        resultsDir: config.resultsDir,
        containerName: `${testResult.testFilePath}`,
        writer: this._writer,
        test: allureFileTest,
      });
    }
  }

  async onRunComplete(
    testContexts: Set<TestContext>,
    aggregatedResult: AggregatedResult,
  ): Promise<void> {
    await super.onRunComplete(testContexts, aggregatedResult);

    const execute = this.#onRunComplete.bind(this, aggregatedResult);
    const attempt = this.#attempt.bind(this, 'onRunComplete()', execute);
    await log.trace.complete(__TID(), 'onRunComplete', attempt);
    await log.trace.end(__TID());
  }

  async #onRunComplete(aggregatedResult: AggregatedResult) {
    const globalMetadataProxy = this._globalMetadataProxy;
    globalMetadataProxy.set('stop', Date.now());

    const allureWriter = this._writer;
    const config = this._config;
    const globalContext = this._globalContext;
    const testRunContext: PropertyExtractorContext<TestRunExtractorContext, void> = {
      ...globalContext,
      aggregatedResult,
      result: {},
      testRunMetadata: globalMetadataProxy.get(),
      value: undefined,
    };

    const allureRunTest = await resolvePromisedTestCase(testRunContext, config.testRun);
    if (allureRunTest) {
      await writeTest({
        resultsDir: config.resultsDir,
        containerName: `Test Run (${process.pid})`,
        writer: allureWriter,
        test: allureRunTest,
      });
    }

    await allureWriter.cleanup?.();
  }

  // Executing this once per file should be enough to scan source maps of auxiliary files
  #scanSourceMaps = memoize(async (_testPath: string) => {
    const globalMetadataProxy = this._globalMetadataProxy;
    const loadedFiles = globalMetadataProxy
      .get<string[]>('loadedFiles', [])
      .filter(FileNavigatorCache.instance.hasScannedSourcemap);

    if (loadedFiles.length === 0) {
      return;
    }

    return Promise.all(loadedFiles.map(FileNavigatorCache.instance.scanSourcemap));
  });
}
