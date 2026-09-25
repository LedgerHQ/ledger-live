import type { Parameter } from '@support/jest-allure2-reporter';

import { isObject } from '../../../utils';

export function isParameter(value: unknown): value is Partial<Parameter> {
  return isObject(value);
}
