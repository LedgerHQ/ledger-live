import type { MaybePromise } from '@support/jest-allure2-reporter';
export declare function isPromiseLike<T>(maybePromise: MaybePromise<T>): maybePromise is Promise<T>;
