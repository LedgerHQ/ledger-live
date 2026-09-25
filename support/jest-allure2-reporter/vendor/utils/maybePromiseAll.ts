import type { MaybePromise } from '@support/jest-allure2-reporter';

import { isPromiseLike } from './isPromiseLike';

export function maybePromiseAll<T, R>(
  maybePromiseArray: MaybePromise<T>[],
  callback: (resolvedValues: T[]) => MaybePromise<R>,
): MaybePromise<R> {
  return maybePromiseArray.some(isPromiseLike)
    ? Promise.all(maybePromiseArray).then(callback)
    : callback(maybePromiseArray as T[]);
}
