// Private to the package: no barrel re-exports this file.
// Same rules as the guards of @ledgerhq/live-config, whose sources fail the strict preset.

/** Keys that reach `Object.prototype` by assignment or constructor lookup. */
export const UNSAFE_OVERRIDE_KEYS: ReadonlySet<string> = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/** A plain object literal or `Object.create(null)`, never a Date, Map or class instance. */
export const isPlainObjectOverride = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** A fresh shallow copy without prototype-pollution keys and `undefined` values. */
export const cloneOverridesSafely = (input: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (UNSAFE_OVERRIDE_KEYS.has(key)) continue;
    const value = input[key];
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
};
