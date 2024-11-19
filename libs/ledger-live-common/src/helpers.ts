// Small helper to avoid issues with includes and typescript
// more infos: https://fettblog.eu/typescript-array-includes/
export function includes<T extends U, U>(array: ReadonlyArray<T>, element: U): element is T {
  return array.includes(element as T);
}

//Avoid keyof <Type> while mapping with ObjectKeys
//https://github.com/sindresorhus/ts-extras/blob/main/source/object-keys.ts#L24
export function objectKeysType<Type extends object>(value: Type): Array<keyof Type> {
  return Object.keys(value) as Array<keyof Type>;
}

export function reverseRecord<T extends PropertyKey, U extends PropertyKey>(
  input: Record<T, U>,
): Record<U, T> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [value, key]));
}
