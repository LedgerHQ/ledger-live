import type { MaybeNullish, MaybePromise, PropertyCustomizer, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function constantExtractor(maybeExtractor: null | undefined): undefined;
export declare function constantExtractor<Context, Value, Result = Value>(maybeExtractor: PropertyCustomizer<Context, Value, Result>): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>>;
export declare function constantExtractor<Context, Value, Result = Value>(maybeExtractor: MaybeNullish<PropertyCustomizer<Context, Value, Result>>): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>> | undefined;
