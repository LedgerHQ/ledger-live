import type { MaybeArray, MaybeNullish, MaybePromise, PropertyExtractorContext } from '@support/jest-allure2-reporter';
export declare const last: <T>(context: PropertyExtractorContext<{}, MaybePromise<MaybeNullish<MaybeArray<T>>>>) => MaybePromise<T | undefined>;
