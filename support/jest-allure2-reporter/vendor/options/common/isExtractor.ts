/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PropertyExtractor } from '@support/jest-allure2-reporter';

export function isExtractor<Context, Value, Result>(
  value: unknown,
): value is PropertyExtractor<Context, Value, Result> {
  return typeof value === 'function';
}
