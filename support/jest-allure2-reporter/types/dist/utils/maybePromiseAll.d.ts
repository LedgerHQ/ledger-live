import type { MaybePromise } from '@support/jest-allure2-reporter';
export declare function maybePromiseAll<T, R>(maybePromiseArray: MaybePromise<T>[], callback: (resolvedValues: T[]) => MaybePromise<R>): MaybePromise<R>;
