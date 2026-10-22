export function deepFreezeLikeImmer<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;

  const proto = Object.getPrototypeOf(value);
  const isPlainObjectOrArray = Array.isArray(value) || proto === Object.prototype || proto === null;
  if (!isPlainObjectOrArray) return value;

  Object.freeze(value);
  for (const child of Object.values(value)) deepFreezeLikeImmer(child);
  return value;
}
