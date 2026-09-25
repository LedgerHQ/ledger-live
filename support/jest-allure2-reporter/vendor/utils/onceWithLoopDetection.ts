import { log } from '../logger';

export function onceWithLoopDetection<F extends (...arguments_: any[]) => any>(function_: F): F {
  let result: ReturnType<F>;
  let called = false;
  let executed = false;

  return function onceWrapper(this: unknown, ...arguments_: unknown[]) {
    if (!called) {
      called = true;
      result = function_.apply(this, arguments_);
      executed = true;
    }

    if (!executed) {
      log.warn('Recursive loop detected in: %s', function_);
    }

    return result;
  } as F;
}
