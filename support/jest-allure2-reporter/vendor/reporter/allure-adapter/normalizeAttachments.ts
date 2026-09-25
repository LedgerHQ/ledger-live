import path from 'node:path';

import type { AllureTestCaseResult, AllureTestStepResult } from '@support/jest-allure2-reporter';

export function normalizeAttachments(
  rootDirectory: string,
  result: AllureTestCaseResult | AllureTestStepResult,
) {
  return result.attachments?.map((attachment) => {
    const source = path.relative(rootDirectory, attachment.source);
    return source.startsWith('..') ? attachment : { ...attachment, source };
  });
}
