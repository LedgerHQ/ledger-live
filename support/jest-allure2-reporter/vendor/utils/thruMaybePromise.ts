import type { MaybePromise } from '@support/jest-allure2-reporter';

import { isPromiseLike } from './isPromiseLike';

interface MaybePromiseProcessor {
  <T, R = T>(value: Promise<T>, callback: (resolvedValue: T) => MaybePromise<R>): Promise<R>;
  <T, R = T>(value: MaybePromise<T>, callback: (resolvedValue: T) => Promise<R>): Promise<R>;
  <T, R = T>(
    value: MaybePromise<T>,
    callback: (resolvedValue: T) => MaybePromise<R>,
  ): MaybePromise<R>;
}

export const thruMaybePromise: MaybePromiseProcessor = (input, callback) => {
  return isPromiseLike(input)
    ? input.then((resolvedValue) => callback(resolvedValue))
    : callback(input);
};
