import type { MaybePromise } from '@support/jest-allure2-reporter';

import type { Function_ } from './types';
import { thruMaybePromise } from './thruMaybePromise';
import { wrapFunction } from './wrapFunction';

interface FunctionHijacker {
  <T>(
    function_: Function_<T>,
    callback: (functionResult: T, functionArguments: unknown[]) => void,
  ): typeof function_;
  <T>(
    function_: Function_<MaybePromise<T>>,
    callback: (functionResult: T, functionArguments: unknown[]) => void,
  ): typeof function_;
  <T>(
    function_: Function_<Promise<T>>,
    callback: (functionResult: T, functionArguments: unknown[]) => void,
  ): typeof function_;
}

export const hijackFunction: FunctionHijacker = (function_, callback) => {
  return wrapFunction(
    function_,
    function hijackFunctionWrapper(this: unknown, ...arguments_: unknown[]) {
      const result = Reflect.apply(function_, this, arguments_) as MaybePromise<any>;

      return thruMaybePromise(result, (value) =>
        thruMaybePromise(callback(value, arguments_), () => value),
      );
    },
  );
};
