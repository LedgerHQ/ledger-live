import type { MaybeNullish, MaybePromise, PropertyCustomizer, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function mergerExtractor<Context, Value extends {}>(maybeExtractor: PropertyCustomizer<Context, Value, MaybeNullish<Value>>): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Value | undefined>>;
export declare function mergerExtractor<Context, Value extends {}>(maybeExtractor: PropertyCustomizer<Context, Value, MaybeNullish<Value>>, fallbackValue: Value): PropertyExtractor<Context, MaybePromise<Value>> | undefined;
