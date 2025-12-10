/**
 *
 * @param hooks - An array of functions that take an array of items of type T and return an array of items of type U or undefined.
 * @template T - The type of the items in the input array.
 * @template U - The type of the items in the output array.
 * @description This function composes multiple hooks into a single hook that processes an array of items of type T and returns an array of items of type T & U.
 * @returns  A function that takes an array of items of type T and returns an array of items of type T & U.
 *
 */

export function composeHooks<T, U>(
  ...hooks: Array<(items: T[]) => U[] | undefined>
): (items: T[]) => (T & U)[] {
  return (items: T[]): (T & U)[] => {
    if (!items || items.length === 0) return [];

    return hooks.reduce<(T & U)[]>(
      (acc, hook) => {
        const result = hook?.(acc as T[]) ?? [];
        return acc.map((item, i) => ({
          ...item,
          ...result[i],
        }));
      },
      items as (T & U)[],
    );
  };
}
