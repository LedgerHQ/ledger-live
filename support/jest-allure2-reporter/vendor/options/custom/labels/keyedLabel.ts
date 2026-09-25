import type { KeyedLabelCustomizer, KeyedLabelExtractor } from '@support/jest-allure2-reporter';

import { appender, compose2 } from '../../common';
import { asArray, thruMaybePromise } from '../../../utils';

export function keyedLabel<Context>(
  value: KeyedLabelCustomizer<Context>,
): KeyedLabelExtractor<Context> | undefined {
  if (value == null) {
    return;
  }

  if (typeof value === 'function') {
    return value;
  }

  if (typeof value === 'string') {
    return (context) => thruMaybePromise(context.value, (base) => base ?? value);
  }

  return compose2(appender(value), ({ value }) => asArray(value));
}
