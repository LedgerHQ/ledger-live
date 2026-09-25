import type {
  AllureTestCaseResult,
  AllureTestStepResult,
  PromisedProperties,
  PropertyExtractorContext,
  TestCaseExtractorContext,
  TestStepExtractorContext,
} from '@support/jest-allure2-reporter';

export const createTestStepContext = (
  value?: Partial<AllureTestStepResult>,
): PropertyExtractorContext<
  TestStepExtractorContext,
  PromisedProperties<AllureTestStepResult>
> => ({
  value: {
    ignored: false,
    hookType: undefined,
    displayName: '',
    start: Number.NaN,
    stop: Number.NaN,
    stage: 'pending',
    status: 'unknown',
    steps: undefined,
    parameters: undefined,
    ...value,
  },
  result: {},
  aggregatedResult: {} as any,
  testRunMetadata: {} as any,
  testCase: {} as any,
  testCaseMetadata: {} as any,
  testStepMetadata: {} as any,
  filePath: [],
  testFile: {} as any,
  testFileMetadata: {} as any,
  $: {} as any,
  globalConfig: {} as any,
  reporterConfig: {} as any,
});

export const createTestCaseContext = (
  value?: Partial<AllureTestCaseResult>,
): PropertyExtractorContext<
  TestCaseExtractorContext,
  PromisedProperties<AllureTestCaseResult>
> => ({
  result: {},
  testRunMetadata: {} as any,
  testCase: {} as any,
  testCaseMetadata: {} as any,
  filePath: [],
  testFileMetadata: {} as any,
  $: {} as any,
  globalConfig: {} as any,
  reporterConfig: {} as any,
  value: {
    uuid: '',
    ignored: false,
    historyId: '',
    displayName: '',
    fullName: '',
    start: Number.NaN,
    stop: Number.NaN,
    description: '',
    descriptionHtml: '',
    stage: 'pending',
    status: 'unknown',
    statusDetails: undefined,
    steps: undefined,
    labels: undefined,
    links: undefined,
    attachments: undefined,
    parameters: undefined,
    ...value,
  },
});
