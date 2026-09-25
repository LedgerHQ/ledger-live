import type {
  MaybeNullish,
  MaybePromise,
  PropertyCustomizer,
  PropertyExtractor,
} from '@support/jest-allure2-reporter';

export function constantExtractor(maybeExtractor: null | undefined): undefined;
export function constantExtractor<Context, Value, Result = Value>(
  maybeExtractor: PropertyCustomizer<Context, Value, Result>,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>>;
export function constantExtractor<Context, Value, Result = Value>(
  maybeExtractor: MaybeNullish<PropertyCustomizer<Context, Value, Result>>,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>> | undefined;
export function constantExtractor<Context, Value, Result = Value>(
  maybeExtractor: MaybeNullish<PropertyCustomizer<Context, Value, Result>>,
): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>> | undefined {
  if (maybeExtractor == null) {
    return undefined;
  }

  return typeof maybeExtractor === 'function'
    ? (maybeExtractor as PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>>)
    : () => maybeExtractor as MaybePromise<Result>;
}
