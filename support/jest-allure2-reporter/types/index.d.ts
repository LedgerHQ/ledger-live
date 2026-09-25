/* eslint-disable @typescript-eslint/no-empty-interface */

import type {AggregatedResult, Config, TestCaseResult, TestResult} from '@jest/reporters';
import JestMetadataReporter from 'jest-metadata/reporter';

declare module '@support/jest-allure2-reporter' {
  // region Options

  export interface ReporterOptions {
    /**
     * Extend the base configuration with custom options.
     * You can apply multiple extensions in a chain.
     */
    extends?: MaybeArray<string | ReporterOptions>;
    /**
     * Overwrite the results directory if it already exists.
     * @default true
     */
    overwrite?: boolean;
    /**
     * Specify where to output test result files.
     * Please note that the results directory is not a ready-to-view Allure report.
     * You'll need to generate the report using the `allure` CLI.
     *
     * @default 'allure-results'
     */
    resultsDir?: string;
    /**
     * Inject Allure's global variables into the test environment.
     * Those who don't want to pollute the global scope can disable this option
     * and import the `@support/jest-allure2-reporter/api` module in their test files.
     *
     * @default true
     */
    injectGlobals?: boolean;
    /**
     * Configure how external attachments are attached to the report.
     */
    attachments?: AttachmentsOptions;
    /**
     * Tweak the way source code and docblocks are extracted from test files.
     */
    sourceCode?: SourceCodeProcessorOptions;
    /**
     * Configures the defect categories for the report.
     *
     * By default, the report will have the following categories:
     * `Product defects`, `Test defects` based on the test case status:
     * `failed` and `broken` respectively.
     */
    categories?: CategoriesCustomizer;
    /**
     * Configures the environment information that will be reported.
     */
    environment?: EnvironmentCustomizer;
    /**
     * Configures the executor information that will be reported.
     */
    executor?: ExecutorCustomizer;
    /**
     * Customize extractor helpers object to use later in the customizers.
     */
    helpers?: HelpersCustomizer;
    /**
     * Customize how to report test runs (sessions) as pseudo-test cases.
     * This is normally used to report broken global setup and teardown hooks,
     * and to provide additional information about the test run.
     */
    testRun?: TestCaseCustomizer<TestRunExtractorContext>;
    /**
     * Customize how to report test files as pseudo-test cases.
     * This is normally used to report broken test files, so that you can be aware of them,
     * but advanced users may find other use cases.
     */
    testFile?: TestCaseCustomizer<TestFileExtractorContext>;
    /**
     * Customize how test cases are reported: names, descriptions, labels, status, etc.
     */
    testCase?: TestCaseCustomizer<TestCaseExtractorContext>;
    /**
     * Customize how individual test steps are reported.
     */
    testStep?: TestStepCustomizer;
    /**
     * Custom AllureWriter implementation or configuration.
     *
     * @example './my-writer.js'
     * @example MyWriterClass
     * @example new MyWriter({ url: 'mongodb://...' })
     * @example ['./database-writer.js', { connectionString: 'mongodb://...' }]
     * @example [MyWriterClass, { batchSize: 100 }]
     */
    writer?: string | Function | object | [string | Function, any];
  }

  export interface AttachmentsOptions {
    /**
     * Defines a subdirectory within the {@link ReporterOptions#resultsDir} where attachments will be stored.
     * Use absolute path if you want to store attachments outside the {@link ReporterOptions#resultsDir} directory.
     * @default 'attachments'
     */
    subDir?: string;
    /**
     * Specifies default strategy for attaching files to the report by their path.
     * - `copy` - copy the file to {@link AttachmentsOptions#subDir}
     * - `move` - move the file to {@link AttachmentsOptions#subDir}
     * - `ref` - use the file path as is
     * @default 'ref'
     * @see {@link AllureRuntime#createFileAttachment}
     */
    fileHandler?: BuiltinFileAttachmentHandler | string;
    /**
     * Specifies default strategy for attaching dynamic content to the report.
     * Uses simple file writing by default.
     * @default 'write'
     * @see {@link AllureRuntime#createContentAttachment}
     */
    contentHandler?: BuiltinContentAttachmentHandler | string;
  }

  /** @see {@link AttachmentsOptions#fileHandler} */
  export type BuiltinFileAttachmentHandler = 'copy' | 'move' | 'ref';

  /** @see {@link AttachmentsOptions#contentHandler} */
  export type BuiltinContentAttachmentHandler = 'write';

  export interface SourceCodeProcessorOptions {
    enabled?: boolean;
    plugins?: Record<string, SourceCodePluginCustomizer | unknown | [SourceCodePluginCustomizer, unknown?]>;
  }

  // endregion

  // region Customizers

  export type SourceCodePluginCustomizer = PropertyExtractor<GlobalExtractorContext, unknown, MaybePromise<SourceCodePlugin | undefined>>;

  export interface SourceCodePlugin {
    readonly name: string;

    extractDocblock?(context: Readonly<DocblockExtractionContext>): MaybePromise<AllureTestItemDocblock | undefined>;
    extractSourceCode?(location: Readonly<AllureTestItemSourceLocation>, includeComments: boolean): MaybePromise<ExtractSourceCodeHelperResult | undefined>;
  }

  export interface DocblockExtractionContext extends AllureTestItemSourceLocation {
    transformedCode?: string;
  }

  export interface TestCaseCustomizer<Context = {}> {
    /**
     * Extractor to generate a unique identifier for the test case file.
     * Do not use it unless you need predictable JSON paths for some demo purposes.
     */
    uuid?: PropertyCustomizer<Context, string>;
    /**
     * Extractor to omit test cases from the report.
     */
    ignored?: PropertyCustomizer<Context, boolean>;
    /**
     * Test case ID extractor to fine-tune Allure's history feature.
     * @example ({ package, file, test }) => `${package.name}:${file.path}:${test.fullName}`
     * @example ({ test }) => `${test.identifier}:${test.title}`
     * @see https://wix-incubator.github.io/@support/jest-allure2-reporter/docs/config/history/#test-case-id
     */
    historyId?: PropertyCustomizer<Context, Primitive>;
    /**
     * Extractor for the default test or step name.
     * @default ({ test }) => test.title
     */
    displayName?: PropertyCustomizer<Context, string>;
    /**
     * Extractor for the full test case name.
     * @default ({ test }) => test.fullName
     */
    fullName?: PropertyCustomizer<Context, string>;
    /**
     * Extractor for the test case start timestamp.
     */
    start?: PropertyCustomizer<Context, number>;
    /**
     * Extractor for the test case stop timestamp.
     */
    stop?: PropertyCustomizer<Context, number>;
    /**
     * Extractor for the test case description.
     * @example ({ testCaseMetadata }) => '```js\n' + testCaseMetadata.transformedCode + '\n```'
     */
    description?: PropertyCustomizer<Context, string>;
    /**
     * Extractor for the test case description in HTML format.
     * @example ({ testCaseMetadata }) => '<pre><code>' + testCaseMetadata.transformedCode + '</code></pre>'
     */
    descriptionHtml?: PropertyCustomizer<Context, string>;
    /**
     * Extractor for the test case stage.
     */
    stage?: PropertyCustomizer<Context, Stage>;
    /**
     * Extractor for the test case status.
     * @see https://wix-incubator.github.io/@support/jest-allure2-reporter/docs/config/statuses/
     * @example ({ value }) => value === 'broken' ? 'failed' : value
     */
    status?: PropertyCustomizer<Context, Status>;
    /**
     * Extractor for the test case status details.
     */
    statusDetails?: PropertyCustomizer<Context, MaybeNullish<StatusDetails>>;
    /**
     * Customize Allure labels for the test case.
     *
     * @example
     * {
     *   suite: ({ file }) => file.path,
     *   subSuite: ({ test }) => test.ancestorTitles[0],
     * }
     */
    labels?: LabelsCustomizer<Context>;
    /**
     * Resolve issue links for the test case.
     *
     * @example
     * {
     *   issue: ({ value }) => ({
     *     type: 'issue',
     *     name: value.name ?? `Open ${value.url} in JIRA`,
     *     url: `https://jira.company.com/${value.url}`,
     *   }),
     * }
     */
    links?: LinksCustomizer<Context>;
    /**
     * Customize step or test case attachments.
     */
    attachments?: AttachmentsCustomizer<Context>;
    /**
     * Customize step or test case parameters.
     */
    parameters?: ParametersCustomizer<Context>;
  }

  /**
   * Global customizations for how test steps are reported, e.g.
   * beforeAll, beforeEach, afterEach, afterAll hooks and custom steps.
   */
  export interface TestStepCustomizer<Context =  TestStepExtractorContext> {
    /**
     * Extractor to omit test steps from the report.
     */
    ignored?: PropertyCustomizer<Context, boolean>;
    /**
     * Extractor for the step name.
     * @example ({ value }) => value.replace(/(before|after)(Each|All)/, (_, p1, p2) => p1 + ' ' + p2.toLowerCase())
     */
    displayName?: PropertyCustomizer<Context, string>;
    /**
     * Extractor for the test step start timestamp.
     */
    start?: PropertyCustomizer<Context, number>;
    /**
     * Extractor for the test step stop timestamp.
     */
    stop?: PropertyCustomizer<Context, number>;
    /**
     * Extractor for the test step stage.
     * @see https://wix-incubator.github.io/@support/jest-allure2-reporter/docs/config/statuses/
     * @example ({ value }) => value === 'running' ? 'pending' : value
     */
    stage?: PropertyCustomizer<Context, Stage>;
    /**
     * Extractor for the test step status.
     * @see https://wix-incubator.github.io/@support/jest-allure2-reporter/docs/config/statuses/
     * @example ({ value }) => value === 'broken' ? 'failed' : value
     */
    status?: PropertyCustomizer<Context, Status>;
    /**
     * Extractor for the test step status details.
     */
    statusDetails?: PropertyCustomizer<Context, MaybeNullish<StatusDetails>>;
    /**
     * Customize step or test step attachments.
     */
    attachments?: AttachmentsCustomizer<Context>;
    /**
     * Customize step or test step parameters.
     */
    parameters?: ParametersCustomizer<Context>;
  }

  export type CategoriesCustomizer = PropertyCustomizer<GlobalExtractorContext, Category[]>;

  export type EnvironmentCustomizer = PropertyCustomizer<GlobalExtractorContext, Record<string, Primitive>>;

  export type ExecutorCustomizer = PropertyCustomizer<GlobalExtractorContext, ExecutorInfo>;

  export type HelpersCustomizer =
    | PropertyExtractor<GlobalExtractorContext, PromisedProperties<Helpers>>
    | HelperCustomizersMap;

  export type HelperCustomizersMap = {
    [K in keyof Helpers]?: KeyedHelperCustomizer<K>;
  };

  export type KeyedHelperCustomizer<K extends keyof Helpers> =
    PropertyExtractor<GlobalExtractorContext, MaybePromise<Helpers[K]>>;

  export type AttachmentsCustomizer<Context> = PropertyCustomizer<Context, Attachment[]>;

  export type LabelsCustomizer<Context> =
    | PropertyCustomizer<Context, Label[]>
    | Record<LabelName, KeyedLabelCustomizer<Context>>;

  export type KeyedLabelCustomizer<Context> =
    | MaybeNullish<MaybeArray<string>>
    | KeyedLabelExtractor<Context>

  export type KeyedLabelExtractor<Context> =
    PropertyExtractor<
      Context,
      MaybeNullish<MaybeArray<string>>,
      MaybePromise<MaybeNullish<MaybeArray<string>>>
    >;

  export type LinksCustomizer<Context> =
    | PropertyCustomizer<Context, Link[]>
    | Record<LinkType, KeyedLinkCustomizer<Context>>;

  export type KeyedLinkCustomizer<Context> =
    | MaybeNullish<string | Link | Link[]>
    | KeyedLinkExtractor<Context>;

  export type KeyedLinkExtractor<Context> =
    PropertyExtractor<
      Context,
      MaybeNullish<MaybeArray<Link>>,
      MaybePromise<MaybeNullish<MaybeArray<Link>>>
    >;

  export type ParametersCustomizer<Context> =
    | PropertyCustomizer<Context, Parameter[]>
    | Record<string, KeyedParameterCustomizer<Context>>;

  export type KeyedParameterCustomizer<Context> = PropertyCustomizer<
    Context,
    Parameter,
    Primitive | Partial<Parameter>
  >;

  export type PropertyCustomizer<Context, Value, Result = Value> = Result | PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>>;

  // endregion

  // region Extractors

  export type PropertyExtractor<
    Context,
    Value,
    Result = Value,
  > = (context: PropertyExtractorContext<Context, Value>) => Result;

  export type PropertyExtractorContext<Context, Value> = Readonly<Context & { value: Value }>;

  export type PromisedProperties<T> = {
    readonly [K in keyof T]: MaybePromise<T[K]>;
  };

  export interface GlobalExtractorContext {
    $: Helpers;
    globalConfig: Config.GlobalConfig;
    reporterConfig: unknown;
  }

  export interface TestItemExtractorContext<Value> extends GlobalExtractorContext {
    result: Partial<PromisedProperties<Value>>;
    testRunMetadata: AllureTestRunMetadata;
  }

  export interface TestRunExtractorContext extends TestItemExtractorContext<AllureTestCaseResult> {
    aggregatedResult: AggregatedResult;
  }

  export interface TestFileExtractorContext extends TestItemExtractorContext<AllureTestCaseResult> {
    filePath: string[];
    testFile: TestResult;
    testFileMetadata: AllureTestFileMetadata;
  }

  export interface TestCaseExtractorContext extends TestItemExtractorContext<AllureTestCaseResult> {
    filePath: string[];
    testCase: TestCaseResult;
    testCaseMetadata: AllureTestCaseMetadata;
    testFileMetadata: AllureTestFileMetadata;
  }

  export interface TestStepExtractorContext extends TestItemExtractorContext<AllureTestStepResult> {
    aggregatedResult?: AggregatedResult;

    filePath?: string[];
    testCase?: TestCaseResult;
    testCaseMetadata?: AllureTestCaseMetadata;
    testFile?: TestResult;
    testFileMetadata?: AllureTestFileMetadata;
    testStepMetadata: AllureTestStepMetadata;
  }

  export interface Helpers extends HelpersAugmentation {
    /**
     * Provides an optimized way to navigate through the test file content.
     * Accepts a file path in a string or a split array format.
     * @param filePath - the path to the file to navigate, split by directory separators or as a single string.
     * @returns a file navigator object or undefined if the file is not found or cannot be read.
     */
    getFileNavigator(filePath: string | string[]): Promise<FileNavigator | undefined>;
    /**
      * Extracts the source code of the current test case or step.
      * @param location - the location of the source code to extract.
      * @param includeComments - whether to include comments before the actual code.
      * @returns the extracted source code or undefined if the source code is not found.
      * @example
      * ({ $, testFileMetadata }) => $.extractSourceCode(testFileMetadata.sourceLocation)
      */
    extractSourceCode(location: AllureTestItemSourceLocation | undefined, includeComments?: boolean): Promise<ExtractSourceCodeHelperResult | undefined>;
    /**
     * Extracts the manifest of the current project or a specific package.
     * Pass a callback to extract specific data from the manifest – this way you can omit async/await.
     *
     * @example
     * ({ $ }) => $.manifest('', m => m.version)
     * @example
     * ({ $ }) => $.manifest('jest', jest => jest.version)
     * @example
     * ({ $ }) => (await $.manifest()).version
     * @example
     * ({ $ }) => (await $.manifest('jest')).version
     */
    manifest: ManifestHelper;
    /**
      * Strips ANSI escape codes from the given string or object.
      * @example
      * $.stripAnsi('Hello, \u001b[31mworld\u001b[0m!')
      * @example
      * $.stripAnsi({ message: 'Hello, \u001b[31mworld\u001b[0m!' })
      */
    stripAnsi: StripAnsiHelper;
  }

  export interface FileNavigator {
    getContent(): string;
    getLines(): string[];
    getLineCount(): number;
    getPosition(): [number, number, number];
    jump(lineNumber: number): boolean;
    jumpToPosition(position: number): boolean;
    moveUp(countOfLines?: number): boolean;
    moveDown(countOfLines?: number): boolean;
    readLine(lineNumber?: number): string;
  }

  export interface ManifestHelper {
    (packageName?: string): Promise<Record<string, any> | undefined>;
    <T>(extractor: string[] | ManifestHelperExtractor<T>): Promise<T | undefined>;
    <T>(extractor: string[] | ManifestHelperExtractor<T>, defaultValue: T): Promise<T>;
    <T>(packageName: string, extractor: MaybeArray<string> | ManifestHelperExtractor<T>): Promise<T | undefined>;
    <T>(packageName: string, extractor: MaybeArray<string> | ManifestHelperExtractor<T>, defaultValue: T): Promise<T>;
  }

  export type ManifestHelperExtractor<T> = (manifest: Record<string, any>) => T;

  /**
   * Represents the result of extracting source code from a file.
   * Can be used for reporting in HTML and Markdown formats.
   */
  export interface ExtractSourceCodeHelperResult {
    /**
     * The extracted source code.
     */
    code?: string;

    /**
     * The programming language of the source code, usually required for syntax highlighting.
     */
    language?: string;

    /**
     * The name of the file from which the source code was extracted.
     * Code preview components may use this property to display the file name.
     */
    fileName?: string;

    /**
     * The starting line number of the extracted source code.
     * Line numbers are 1-based, meaning the first line starts at 1.
     * Code preview components may use this property to highlight the code.
     */
    startLine?: number;

    /**
     * The starting column number of the extracted source code.
     * Column numbers are 1-based, meaning the first column starts at 1.
     * Code preview components may use this property to put the cursor in the right place.
     */
    startColumn?: number;

    /**
     * The ending line number of the extracted source code.
     * Line numbers are 1-based, meaning the first line starts at 1.
     * Code preview components may use this property to highlight the code.
     */
    endLine?: number;

    /**
     * The ending column number of the extracted source code.
     * Column numbers are 1-based, meaning the first column starts at 1.
     */
    endColumn?: number;
  }

  export interface StripAnsiHelper {
    /**
      * Strips ANSI escape codes from the given string or object.
      *
      * @example
      * $.stripAnsi('Hello, \u001b[31mworld\u001b[0m!')
      *
      * @example
      * $.stripAnsi({ message: 'Hello, \u001b[31mworld\u001b[0m!' })
      */
    <R>(textOrObject: R): R;
  }

  // endregion

  // region Custom Metadata

  export interface AllureTestItemMetadata {
    /**
     * File attachments to be added to the test case, test step or a test file.
     */
    attachments?: Attachment[];
    /**
     * Property path to the current step metadata object.
     * @see {steps}
     * @example ['steps', '0']
     */
    currentStep?: AllureTestStepPath;
    /**
     * Parsed docblock: comments and pragmas.
     */
    docblock?: AllureTestItemDocblock;
    /**
     * Title of the test case or test step.
     */
    displayName?: string;
    /**
     * Custom history ID to distinguish between tests and their retry attempts.
     */
    historyId?: Primitive;
    /**
     * Key-value pairs to disambiguate test cases or to provide additional information.
     */
    parameters?: Parameter[];
    /**
     * Location (file, line, column) of the test case, test step or a hook.
     */
    sourceLocation?: AllureTestItemSourceLocation;
    /**
     * Indicates test item execution progress.
     */
    stage?: Stage;
    /**
     * Start timestamp in milliseconds.
     */
    start?: number;
    /**
     * Test result: failed, broken, passed, skipped or unknown.
     */
    status?: Status;
    /**
     * Extra information about the test result: message and stack trace.
     */
    statusDetails?: StatusDetails;
    /**
     * Recursive data structure to represent test steps for more granular reporting.
     */
    steps?: AllureNestedTestStepMetadata[];
    /**
     * Stop timestamp in milliseconds.
     */
    stop?: number;
    /**
     * Transformed code of the test case, test step or a hook.
     */
    transformedCode?: string;
  }

  export type AllureTestStepPath = string[];

  export type AllureNestedTestStepMetadata = Omit<AllureTestStepMetadata, 'currentStep'>;

  /** @inheritDoc */
  export interface AllureTestStepMetadata extends AllureTestItemMetadata {
    /**
     * Steps produced by Jest hooks will have this property set.
     * User-defined steps don't have this property.
     */
    hookType?: 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll';
  }

  /** @inheritDoc */
  export interface AllureTestCaseMetadata extends AllureTestItemMetadata {
    /**
     * Markdown description of the test case or test file.
     */
    description?: string[];
    /**
     * Raw HTML description of the test case or test file.
     */
    descriptionHtml?: string[];
    fullName?: string;
    labels?: Label[];
    links?: Link[];
  }

  /** @inheritDoc */
  export interface AllureTestFileMetadata extends AllureTestCaseMetadata {}

  /** @inheritDoc */
  export interface AllureTestRunMetadata extends AllureTestCaseMetadata {
    config: unknown;
    loadedFiles: string[];
    sourceLocation?: never;
    transformedCode?: never;
  }

  export interface AllureTestItemSourceLocation {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  }

  export interface AllureTestItemDocblock {
    comments?: string;
    pragmas?: Record<string, string | string[]>;
  }

  // endregion

  // region Extensibility

  export interface HelpersAugmentation {
    // Use to extend Helpers
  }

  // endregion

  // region Allure Test Data

  export interface AllureTestCaseResult {
    uuid?: string;
    ignored?: boolean;
    historyId: Primitive;
    displayName: string;
    fullName: string;
    start: number;
    stop: number;
    description?: string;
    descriptionHtml?: string;
    stage: Stage;
    status: Status;
    statusDetails?: StatusDetails;
    steps?: AllureTestStepResult[];
    labels?: Label[];
    links?: Link[];
    attachments?: Attachment[];
    parameters?: Parameter[];
  }

  export interface AllureTestStepResult {
    ignored?: boolean;
    hookType?: AllureTestStepMetadata['hookType'];
    displayName: string;
    start: number;
    stop: number;
    stage: Stage;
    status: Status;
    statusDetails?: StatusDetails;
    steps?: AllureTestStepResult[];
    attachments?: Attachment[];
    parameters?: Parameter[];
  }

  // endregion

  //region Allure Vendor types

  export interface Attachment {
    name: string;
    type: string;
    source: string;
  }

  export interface Category {
    name?: string;
    messageRegex?: string | RegExp;
    traceRegex?: string | RegExp;
    matchedStatuses?: Status[];
    flaky?: boolean;
  }

  export interface ExecutorInfo {
    name?: string;
    type?:
      | 'jenkins'
      | 'bamboo'
      | 'teamcity'
      | 'gitlab'
      | 'github'
      | 'circleci'
      | string;
    url?: string;
    buildOrder?: number;
    buildName?: string;
    buildUrl?: string;
    reportUrl?: string;
    reportName?: string;
  }

  export interface Label {
    name: LabelName;
    value: string;
  }

  export type LabelName =
    | KnownLabelName
    | string;

  export type KnownLabelName =
    | 'epic'
    | 'feature'
    | 'owner'
    | 'package'
    | 'parentSuite'
    | 'severity'
    | 'story'
    | 'subSuite'
    | 'suite'
    | 'tag'
    | 'testClass'
    | 'testMethod'
    | 'thread';

  export interface Link {
    name?: string;
    url: string;
    type?: LinkType;
  }

  export type LinkType = KnownLinkType | string;

  export type KnownLinkType = 'issue' | 'tms';

  export interface Parameter {
    name: string;
    value: Primitive;
    excluded?: boolean;
    mode?: ParameterMode;
  }

  export type ParameterMode = 'hidden' | 'masked' | 'default';
  export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
  export type Stage = 'scheduled' | 'running' | 'finished' | 'pending' | 'interrupted';
  export type Status = 'failed' | 'broken' | 'passed' | 'skipped' | 'unknown';

  export interface StatusDetails {
    message?: string;
    trace?: string;
  }

  //endregion

  export type Primitive = string | number | boolean | null | undefined;

  export type MaybePromise<T> = T | Promise<T>;

  export type MaybeArray<T> = T | T[];

  export type MaybeNullish<T> = T | null | undefined;

  export type MaybeFunction<T> = T | ((...args: any[]) => T);

  export type MaybeWithOptions<T> = T | [T, unknown?];
}

export default class JestAllure2Reporter extends JestMetadataReporter {
  constructor(globalConfig: Config.GlobalConfig, options: ReporterOptions);
}
