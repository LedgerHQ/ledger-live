export async function flatMapAsync<T, U>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<U[]>,
): Promise<U[]> {
  const mappedArrays = await Promise.all(array.map(callback));
  return mappedArrays.flat();
}
