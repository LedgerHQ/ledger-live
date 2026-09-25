import type { TestCaseCustomizer, TestRunExtractorContext } from '@support/jest-allure2-reporter';

import * as custom from '../custom';
import { compose2 } from '../common';

export const testRun: TestCaseCustomizer<TestRunExtractorContext> = {
  ignored: true,
  historyId: ({ testRunMetadata, result }) => testRunMetadata.historyId ?? result.fullName,
  fullName: ({ $, testRunMetadata }) =>
    testRunMetadata.fullName ?? $.manifest(['name'], 'untitled project'),
  displayName: ({ testRunMetadata }) => testRunMetadata.displayName ?? '(test run)',
  description: ({ testRunMetadata }) => testRunMetadata.description?.join('\n\n') ?? '',
  descriptionHtml: ({ testRunMetadata }) => testRunMetadata.descriptionHtml?.join('\n') ?? '',
  start: ({ testRunMetadata, aggregatedResult }) =>
    testRunMetadata.start ?? aggregatedResult.startTime,
  stop: ({ testRunMetadata }) => testRunMetadata.stop!,
  stage: ({ testRunMetadata, aggregatedResult }) =>
    testRunMetadata.stage ?? (aggregatedResult.wasInterrupted ? 'interrupted' : 'finished'),
  status: ({ testRunMetadata, aggregatedResult }) =>
    testRunMetadata.status ?? (aggregatedResult.numFailedTestSuites > 0 ? 'failed' : 'passed'),
  statusDetails: ({ testRunMetadata }) => testRunMetadata.statusDetails,
  attachments: ({ testRunMetadata }) => testRunMetadata.attachments ?? [],
  parameters: compose2(
    custom.parameters<TestRunExtractorContext>({
      'a) Suites passed': ({ aggregatedResult }) => aggregatedResult.numPassedTestSuites,
      'b) Suites failed': ({ aggregatedResult }) =>
        aggregatedResult.numFailedTestSuites - aggregatedResult.numRuntimeErrorTestSuites,
      'c) Suites broken': ({ aggregatedResult }) => aggregatedResult.numRuntimeErrorTestSuites,
      'd) Suites pending': ({ aggregatedResult }) => aggregatedResult.numPendingTestSuites,
    }),
    ({ testRunMetadata }) => testRunMetadata.parameters ?? [],
  ),
  labels: compose2(
    custom.labels<TestRunExtractorContext>({
      thread: '00',
      suite: '(test file execution)',
    }),
    ({ testRunMetadata }) => testRunMetadata.labels ?? [],
  ),
  links: ({ testRunMetadata }) => testRunMetadata.links ?? [],
};
