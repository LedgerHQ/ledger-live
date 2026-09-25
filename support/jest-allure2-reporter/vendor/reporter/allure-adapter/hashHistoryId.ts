import { randomBytes } from 'node:crypto';

import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';

import { log } from '../../logger';
import { md5 } from '../../utils';

export function hashHistoryId(result: AllureTestCaseResult) {
  const { fullName, historyId } = result;
  if (!historyId) {
    log.warn(`Detected empty "historyId" in test: ${fullName}`);
    return md5(randomBytes(16));
  }

  return md5(String(historyId));
}
