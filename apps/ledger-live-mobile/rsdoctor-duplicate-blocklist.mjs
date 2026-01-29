/**
 * Packages that must NEVER be duplicated (E1001). If rsdoctor reports any of these
 * as duplicate, doctor:check fails. Other dups are only warnings.
 *
 * - React / React Native: single version required
 * - @ledgerhq/*: internal libs, single version
 * - Redux: single store
 */
export const DUPLICATE_BLOCKLIST_EXACT = new Set([
  "react",
  "react-dom",
  "react-native",
  "redux",
  "react-redux",
]);

/** Scoped package prefixes that must never be duplicated (e.g. @ledgerhq/foo). */
export const DUPLICATE_BLOCKLIST_SCOPED_PREFIXES = ["@ledgerhq/", "@react-native/"];

export function isBlocked(name) {
  if (DUPLICATE_BLOCKLIST_EXACT.has(name)) return true;
  return DUPLICATE_BLOCKLIST_SCOPED_PREFIXES.some(prefix => name.startsWith(prefix));
}
