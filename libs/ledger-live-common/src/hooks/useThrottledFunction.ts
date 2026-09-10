import { useEffect, useRef, useState } from "react";

export const useThrottledFunction = <FnReturnType, Args extends unknown[]>(
  callbackFunction: (...args: Args) => FnReturnType,
  throttleMs: number,
  args: Args,
): FnReturnType => {
  const [state, setState] = useState<FnReturnType>(() => callbackFunction(...args));
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutMs = useRef<number>(throttleMs);
  const skipInitialValue = useRef(true);
  const nextArgs = useRef<Args | null>(null);

  useEffect(() => {
    const throttleDelayChanged = timeoutMs.current !== throttleMs;
    timeoutMs.current = throttleMs;
    const timeoutCallback = () => {
      if (nextArgs.current) {
        setState(callbackFunction(...nextArgs.current));
        nextArgs.current = null;
        timeout.current = setTimeout(timeoutCallback, timeoutMs.current);
      } else {
        timeout.current = null;
      }
    };
    if (!timeout.current) {
      if (skipInitialValue.current) {
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
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    },
    [],
  );

  return state;
};

export const useThrottledValue = <ValueType>(value: ValueType, throttleMs: number): ValueType => {
  return useThrottledFunction(value => value, throttleMs, [value]);
};

export const useThrottledValues = <Args extends unknown[]>(args: Args, throttleMs: number): Args => {
  return useThrottledFunction((...args) => args, throttleMs, args);
};
