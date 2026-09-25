import type { Test, TestCaseResult } from '@jest/reporters';
import type { AllureTestItemMetadata, AllureTestFileMetadata } from '@support/jest-allure2-reporter';

import type { AllureMetadataProxy } from '../metadata';

import { ThreadService } from './ThreadService';

const threadService = new ThreadService();

export function onTestFileStart(
  test: Test,
  testFileMetadata: AllureMetadataProxy<AllureTestFileMetadata>,
) {
  const threadId = threadService.allocateThread(test.path);

  testFileMetadata
    .assign({
      sourceLocation: { fileName: test.path },
      start: Date.now(),
    })
    .push('labels', [{ name: 'thread', value: String(1 + threadId).padStart(2, '0') }]);
}

export function onTestCaseResult(
  test: Test,
  testCase: TestCaseResult,
  testCaseMetadata: AllureMetadataProxy<AllureTestItemMetadata>,
) {
  testCaseMetadata.defaults({
    sourceLocation: testCase.location
      ? {
          fileName: test.path,
          lineNumber: testCase.location.line,
          columnNumber: testCase.location.column + 1,
        }
      : undefined,
    stop: Date.now(),
  });
}

export function onTestFileResult(
  test: Test,
  testFileMetadata: AllureMetadataProxy<AllureTestFileMetadata>,
) {
  testFileMetadata.set('stop', Date.now());
  threadService.freeThread(test.path);
}
