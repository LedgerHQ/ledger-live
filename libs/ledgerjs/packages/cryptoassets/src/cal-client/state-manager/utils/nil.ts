/**
 * Maps an array and filters out null and undefined values
 * @param array - Input array
 * @param fn - Map function
 * @returns Output array with null and undefined values filtered out
 */
export function mapNotNil<T, U>(
  array: (T | null | undefined)[] | null | undefined,
  fn: (item: T) => U,
): Exclude<U, null | undefined>[] {
  if (!array) return [];

  return array.filter(isNotNil).map(fn).filter(isNotNil);
}

function isNotNil<V>(item: V): item is Exclude<V, null | undefined> {
  return item !== null && item !== undefined;
}
