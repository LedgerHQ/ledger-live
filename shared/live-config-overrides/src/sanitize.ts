import { cloneOverridesSafely, isPlainObjectOverride } from "./internals";

/**
 * Validates a raw `overrides` payload read from storage. Returns a fresh map of
 * own enumerable string-keyed entries, or `null` if the payload isn't a
 * plain object literal (or `Object.create(null)`). Guards against corrupted
 * JSON (arrays, primitives, null), non-plain objects (Date, class instances,
 * Map, etc.), prototype-pollution keys (`__proto__` / `constructor` /
 * `prototype`), and `undefined` values so we never feed garbage to LiveConfig.
 */
export const sanitizePersistedOverrides = (raw: unknown): Record<string, unknown> | null =>
  isPlainObjectOverride(raw) ? cloneOverridesSafely(raw) : null;
