import type { MaybeArray, MaybeNullish, MaybePromise, PropertyCustomizer, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function appenderExtractor<Context, R>(maybeExtractor: PropertyCustomizer<Context, R[], MaybeNullish<MaybeArray<R>>>): PropertyExtractor<Context, MaybePromise<R[]>> | undefined;
