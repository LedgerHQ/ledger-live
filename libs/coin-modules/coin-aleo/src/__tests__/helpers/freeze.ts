export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  const proto = Object.getPrototypeOf(value);
  const isPlainObjectOrArray = Array.isArray(value) || proto === Object.prototype || proto === null;
  if (!isPlainObjectOrArray) return value;

  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
