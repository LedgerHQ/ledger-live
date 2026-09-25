import type { MaybePromise } from '@support/jest-allure2-reporter';
interface MaybePromiseProcessor {
    <T, R = T>(value: Promise<T>, callback: (resolvedValue: T) => MaybePromise<R>): Promise<R>;
    <T, R = T>(value: MaybePromise<T>, callback: (resolvedValue: T) => Promise<R>): Promise<R>;
    <T, R = T>(value: MaybePromise<T>, callback: (resolvedValue: T) => MaybePromise<R>): MaybePromise<R>;
}
export declare const thruMaybePromise: MaybePromiseProcessor;
export {};
