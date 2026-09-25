import type { TestCaseResult } from '@jest/reporters';
import type {
  Label,
  Stage,
  Status,
  TestCaseCustomizer,
  TestCaseExtractorContext,
} from '@support/jest-allure2-reporter';

import { compose2 } from '../common';
import * as custom from '../custom';
import { getStatusDetails } from '../../utils';

export const testCase: TestCaseCustomizer<TestCaseExtractorContext> = {
  ignored: () => false,
  historyId: ({ testCaseMetadata, result }) => testCaseMetadata.historyId ?? result.fullName,
  displayName: ({ testCase, testCaseMetadata }) => testCaseMetadata.displayName ?? testCase.title,
  fullName: ({ testCase, testCaseMetadata }) => testCaseMetadata.fullName ?? testCase.fullName,
  description: ({ testCaseMetadata }) => testCaseMetadata.description?.join('\n\n') ?? '',
  descriptionHtml: ({ testCaseMetadata }) => testCaseMetadata.descriptionHtml?.join('\n') ?? '',
  start: ({ testCase, testCaseMetadata }) =>
    testCaseMetadata.start ?? (testCaseMetadata.stop ?? Date.now()) - (testCase.duration ?? 0),
  stop: ({ testCaseMetadata }) => testCaseMetadata.stop ?? Date.now(),
  stage: ({ testCase, testCaseMetadata }) => testCaseMetadata.stage ?? getTestCaseStage(testCase),
  status: ({ testCase, testCaseMetadata }) =>
    testCaseMetadata.status ?? getTestCaseStatus(testCase),
  statusDetails: ({ $, testCase, testCaseMetadata }) =>
    $.stripAnsi(
      testCaseMetadata.statusDetails ??
        getStatusDetails((testCase.failureMessages ?? []).join('\n')),
    ),
  attachments: ({ testCaseMetadata }) => testCaseMetadata.attachments ?? [],
  parameters: ({ testCaseMetadata }) => testCaseMetadata.parameters ?? [],
  labels: compose2(
    custom.labels<TestCaseExtractorContext>({
      suite: ({ testCase, filePath }) => testCase.ancestorTitles[0] ?? filePath.at(-1),
      subSuite: ({ testCase }) => testCase.ancestorTitles.slice(1).join(' '),
    }),
    ({ testCaseMetadata }): Label[] => testCaseMetadata.labels ?? [],
  ),
  links: ({ testCaseMetadata }) => testCaseMetadata.links ?? [],
};

function getTestCaseStatus(testCase: TestCaseResult): Status {
  const hasErrors = testCase.failureMessages?.length > 0;
  const hasBuiltinErrors = hasErrors && testCase.failureMessages.some(looksLikeBroken);

  switch (testCase.status) {
    case 'passed': {
      return 'passed';
    }
    case 'failed': {
      return hasBuiltinErrors ? 'broken' : 'failed';
    }
    case 'skipped': {
      return 'skipped';
    }
    case 'pending':
    case 'todo':
    case 'disabled': {
      return 'skipped';
    }
    case 'focused': {
      return hasErrors ? 'failed' : 'passed';
    }
    default: {
      return 'unknown' as Status;
    }
  }
}

function looksLikeBroken(errorMessage: string): boolean {
  return errorMessage
    ? errorMessage.startsWith('Error: \n') ||
        errorMessage.startsWith('EvalError:') ||
        errorMessage.startsWith('RangeError:') ||
        errorMessage.startsWith('ReferenceError:') ||
        errorMessage.startsWith('SyntaxError:') ||
        errorMessage.startsWith('TypeError:') ||
        errorMessage.startsWith('URIError:') ||
        errorMessage.startsWith('AggregateError:') ||
        errorMessage.startsWith('InternalError:') ||
        errorMessage.startsWith('AllureRuntimeError:') ||
        errorMessage.startsWith('AllureReporterError:')
    : true;
}

function getTestCaseStage(testCase: TestCaseResult): Stage {
  switch (testCase.status) {
    case 'passed':
    case 'focused': {
      return 'finished';
    }
    case 'todo':
    case 'disabled':
    case 'pending':
    case 'skipped': {
      return 'pending';
    }
    default: {
      return 'interrupted';
    }
  }
}
