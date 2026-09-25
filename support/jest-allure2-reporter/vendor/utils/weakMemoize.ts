/* eslint-disable @typescript-eslint/no-explicit-any */

export function weakMemoize<F extends (argument: any) => any>(function_: F): F {
  const nullCache = new Map<any, any>();
  const weakCache = new WeakMap<object, any>();

  const memoizedFunction = ((argument: any) => {
    if (argument == null) {
      if (!nullCache.has(argument)) {
        nullCache.set(argument, function_(argument));
      }

      return nullCache.get(argument)!;
    } else {
      if (!weakCache.has(argument)) {
        weakCache.set(argument, function_(argument));
      }

      return weakCache.get(argument)!;
    }
  }) as F;

  return memoizedFunction;
}
