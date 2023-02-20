// Small helper to avoid issues with includes and typescript
// more infos: https://fettblog.eu/typescript-array-includes/
export function includes<T extends U, U>(
  array: ReadonlyArray<T>,
  element: U
): element is T {
  return array.includes(element as T);
}
