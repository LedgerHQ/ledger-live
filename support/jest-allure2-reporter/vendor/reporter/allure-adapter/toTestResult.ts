import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import type { Result as Serialized } from 'allure-store';

import { ensureUUID } from './ensureUUID';
import { hashHistoryId } from './hashHistoryId';
import { normalizeLabels } from './normalizeLabels';
import { normalizeAttachments } from './normalizeAttachments';
import { normalizeParameters } from './normalizeParameters';
import { toTestStep } from './toTestStep';

export function toTestResult(rootDirectory: string, test: AllureTestCaseResult): Serialized {
  return {
    uuid: ensureUUID(test),
    historyId: hashHistoryId(test),
    name: test.displayName,
    fullName: test.fullName,
    start: test.start,
    stop: test.stop,
    description: test.descriptionHtml ? undefined : test.description,
    descriptionHtml: test.descriptionHtml,
    stage: test.stage,
    status: test.status,
    statusDetails: test.statusDetails,
    steps: test.steps
      ?.filter((step) => !step.hookType)
      .map((step) => toTestStep(rootDirectory, step)),
    labels: normalizeLabels(test),
    links: test.links,
    attachments: normalizeAttachments(rootDirectory, test),
    parameters: normalizeParameters(test),
  };
}
