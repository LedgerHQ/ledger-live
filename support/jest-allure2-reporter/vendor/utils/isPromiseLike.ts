import type { MaybePromise } from '@support/jest-allure2-reporter';

export function isPromiseLike<T>(maybePromise: MaybePromise<T>): maybePromise is Promise<T> {
  return maybePromise ? typeof (maybePromise as PromiseLike<T>).then === 'function' : false;
}
