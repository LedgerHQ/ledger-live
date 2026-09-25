import type { Function_ } from './types';
export declare function wrapFunction<T, F extends Function_<T>>(function_: F, callback: F): F;
