import type { MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function mapper<Context, Value, Result>(function_: (value: Value) => Result): PropertyExtractor<Context, MaybePromise<Value>, MaybePromise<Result>>;
