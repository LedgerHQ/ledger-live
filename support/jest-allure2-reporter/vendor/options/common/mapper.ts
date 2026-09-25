import type { MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';

import { thruMaybePromise } from '../../utils';

export function mapper<Context, Value, Result>(
  function_: (value: Value) => Result,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>> {
  return (context) => thruMaybePromise(context.value, function_);
}
