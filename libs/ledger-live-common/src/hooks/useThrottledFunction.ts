import { useEffect, useRef, useState } from "react";

/**
 * Hook to throttle the execution of a callback function with a specific delay.
 *
 * @template FnReturnType The type of the return value of the callback function
 * @template Args The type of the arguments for the callback function
 *
 * @param {(...args: Args) => FnReturnType} callbackFunction The callback function to be throttled
 * @param {number} throttleMs The delay in milliseconds for the throttling
 * @param {Args} args The arguments for the callback function
 *
 * @returns {FnReturnType} The throttled result of the callback function
 *
 * This is useful if you need to throttle the call of a function based on all
 * of its inputs.
 *
 * example:
 * ```
 * const a = useSomeRapidlyUpdatingValueB(); // e.g. accounts and operations
 * const b = useSomeRapidlyUpdatingValueA(); // e.g. countervalues
 * const result = useThrottledFunction(
 *    // now this expensive function will be called maximum every 5000ms with
 *    // the latest values of `a` and `b`.
 *    (throttledA, throttledB) => someExpensiveFunction(throttledA, trottledB),
 *    [a, b],
 *    5000,
 * );
 * ```
 */
export const useThrottledFunction = <FnReturnType, Args extends unknown[]>(
  callbackFunction: (...args: Args) => FnReturnType,
  throttleMs: number,
  args: Args
): FnReturnType => {
  const [state, setState] = useState<FnReturnType>(() =>
    callbackFunction(...args)
  );
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const timeoutMs = useRef<number>(throttleMs);
  const skipInitialValue = useRef(true);
  const nextArgs = useRef<Args>();

  useEffect(() => {
    const throttleDelayChanged = timeoutMs.current !== throttleMs;
    timeoutMs.current = throttleMs;
    const timeoutCallback = () => {
      if (nextArgs.current) {
        setState(callbackFunction(...nextArgs.current));
        nextArgs.current = undefined;
        timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
      } else {
        timeout.current = undefined;
      }
    };
    if (!timeout.current) {
      if (skipInitialValue.current) {
        // avoid recomputing twice the initial state
        // (once at state initialisation, then once here at mount)
        skipInitialValue.current = false;
      } else {
        setState(callbackFunction(...args));
      }

      timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
    } else {
      if (throttleDelayChanged) {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
      }
      nextArgs.current = args;
    }
  }, [...args, throttleMs]); // eslint-disable-line

  useEffect(
    () => () => {
      timeout.current && clearTimeout(timeout.current);
    },
    []
  );

  return state;
};

/**
 * Hook to throttle the return of a single value
 *
 * @template ValueType The type of the return value
 *
 * @param {ValueType} value The value to be throttled
 * @param {number} throttleMs The delay in milliseconds for the throttling
 *
 * @returns {ValueType} The throttled value
 *
 * This is useful if you need to throttle the call of a function based on one
 * of its inputs. You throttle that input value with this hook, and in a
 * useEffect that has that input as a dependency, you compute the result of the
 * function.
 * Prefer `useThrottledValues` if you need to throttle several values together.
 *
 * example:
 * ```
 * const a = useSomeRapidlyUpdatingValueA(); // e.g. accounts and operations
 * const c = useSomeOtherParamUpdatingBasedOnUserInput(); // e.g. graph time range
 * const throttledA = useThrottledValue(a, 5000);
 *
 * useEffect(() => {
 *    // now this expensive function is called either
 *    // - everytime `c` changes (on user action)
 *    // - OR if `a` changes, but every 5000ms maximum.
 *    someExpensiveFunction(throttledA, c); // e.g. computing all the values of the graph including countervalues
 * }, [throttledA, c]);
 *
 * ```
 */
export const useThrottledValue = <ValueType>(
  value: ValueType,
  throttleMs: number
): ValueType => {
  return useThrottledFunction((value) => value, throttleMs, [value]);
};

/**
 * Hook to throttle the return of an array of values
 *
 * @template Args The type of the array values
 *
 * @param {Args} args The array of values to be throttled
 * @param {number} throttleMs The delay in milliseconds for the throttling
 *
 * @returns {Args} The throttled array of values
 *
 * This is useful if you need to throttle the call of a function based on two or
 * more of its inputs. You throttle these input values with this hook, and in a
 * useEffect that has these inputs as a dependency, you compute the result of the
 * function.
 *
 * example:
 * ```
 * const a = useSomeRapidlyUpdatingValueB(); // e.g. accounts and operations
 * const b = useSomeRapidlyUpdatingValueA(); // e.g. countervalues
 * const c = useSomeOtherParamUpdatingBasedOnUserAction(); // e.g. graph time range
 * const [throttledA, throttledB] = useThrottledValues([a, b], 5000);
 *
 * useEffect(() => {
 *    // now this expensive function is called either
 *    // - everytime `c` changes (on user action)
 *    // - OR if [`a` changes] or [`b` changes], but every 5000ms maximum.
 *    someExpensiveFunction(throttledA, throttledB, c) // e.g. computing all the values of the graph including countervalues
 * }, [throttledA, throttledB, c]);
 *
 * ```
 */
export const useThrottledValues = <Args extends unknown[]>(
  args: Args,
  throttleMs: number
): Args => {
  return useThrottledFunction((...args) => args, throttleMs, args);
};
