import type { AllureTestCaseResult } from '@support/jest-allure2-reporter';
import { v4, validate } from 'uuid';

import { log } from '../../logger';

export function ensureUUID(result: AllureTestCaseResult) {
  const { uuid, fullName } = result;
  if (uuid && !validate(uuid)) {
    log.warn(`Detected invalid "uuid" (${uuid}) in test: ${fullName}`);
    return v4();
  }

  if (!uuid) {
    return v4();
  }

  return uuid;
}
