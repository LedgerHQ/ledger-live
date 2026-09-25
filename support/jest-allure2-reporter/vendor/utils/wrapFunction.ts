import type { Function_ } from './types';

export function wrapFunction<T, F extends Function_<T>>(function_: F, callback: F): F {
  const wrapper = {
    [function_.name](this: unknown) {
      return Reflect.apply(callback, this, arguments);
    },
  }[function_.name] as F;

  wrapper.toString = function_.toString.bind(function_);
  return wrapper;
}
