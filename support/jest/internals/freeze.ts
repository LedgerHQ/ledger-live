// The one freeze for the presets' exported constant tables: a table and everything it holds.

/** The value, frozen with everything it holds. */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}
