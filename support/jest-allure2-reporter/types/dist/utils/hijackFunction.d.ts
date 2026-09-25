import type { MaybePromise } from '@support/jest-allure2-reporter';
import type { Function_ } from './types';
interface FunctionHijacker {
    <T>(function_: Function_<T>, callback: (functionResult: T, functionArguments: unknown[]) => void): typeof function_;
    <T>(function_: Function_<MaybePromise<T>>, callback: (functionResult: T, functionArguments: unknown[]) => void): typeof function_;
    <T>(function_: Function_<Promise<T>>, callback: (functionResult: T, functionArguments: unknown[]) => void): typeof function_;
}
export declare const hijackFunction: FunctionHijacker;
export {};
