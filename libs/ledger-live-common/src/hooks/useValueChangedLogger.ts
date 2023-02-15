import { useEffect, useRef } from "react";

/**
 * Hook to log the changes of a value
 *
 * @template T The type of the value to be logged
 *
 * @param {T} val The value to be logged
 * @param {string} name The name of the value to be logged
 */
export function useValueChangedLogger<T>(val: T, name: string): void {
  const valRef = useRef<T>(val);
  useEffect(() => {
    const equal = val === valRef.current;
    // eslint-disable-next-line no-console
    if (!equal) console.log(`change logger (${name})`);
    valRef.current = val;
  }, [name, val]);
}

/**
 * Hook to log the changes of refs in the properties of an object
 *
 * @template T The type of the object
 *
 * @param {T} val The object to observe
 * @param {string} name The name of the object to be logged
 */
export function usePropsChangedLogger<T extends { [key: string]: unknown }>(
  obj: T,
  name: string
): void {
  const objRef = useRef<T>(obj);
  useEffect(() => {
    for (const [key, val] of Object.entries(obj)) {
      const from = objRef.current[key];
      const to = val;
      if (to !== from) {
        // eslint-disable-next-line no-console
        console.log(`change logger (${name}[${key}])`, { from, to });
      }
    }
    objRef.current = obj;
  }, [name, obj]);
}
