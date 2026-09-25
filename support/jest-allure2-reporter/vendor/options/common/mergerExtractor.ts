import type {
  MaybeNullish,
  MaybePromise,
  PropertyCustomizer,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

import { thruMaybePromise } from '../../utils';

import { composeExtractors2 } from './composeExtractors2';

export function mergerExtractor<Context, Value extends {}>(
  maybeExtractor: PropertyCustomizer<Context, Value, MaybeNullish<Value>>,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Value | undefined>>;
export function mergerExtractor<Context, Value extends {}>(
  maybeExtractor: PropertyCustomizer<Context, Value, MaybeNullish<Value>>,
  fallbackValue: Value,
): PropertyExtractor<Context, MaybePromise<Value>> | undefined;
export function mergerExtractor<Context, Value extends {}>(
  maybeExtractor: PropertyCustomizer<Context, Value, MaybeNullish<Value>>,
  fallbackValue?: Value,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Value | undefined>> | undefined {
  if (maybeExtractor == null) {
    return;
  }

  if (typeof maybeExtractor === 'object') {
    const value = maybeExtractor;
    return (context): MaybePromise<Value> => {
      const base = context.value;
      return thruMaybePromise(base, (v) => ({ ...v, ...value }));
    };
  }

  const extractor = maybeExtractor as PropertyExtractor<
    Context,
    MaybePromise<Value>,
    MaybePromise<MaybeNullish<Value>>
  >;

  return composeExtractors2(
    ({ value }) =>
      thruMaybePromise(
        value,
        (base: MaybeNullish<Value>): Value | undefined => base ?? fallbackValue,
      ),
    extractor,
  );
}
