/**
 * Resolves a remote copy param for A/B testing.
 *
 * Returns `paramValue` only when the flag is enabled, the locale is English,
 * and `paramValue` is a non-empty string. Otherwise returns `fallback`.
 */
export function resolveRemoteCopy(
  enabled: boolean | undefined,
  isEN: boolean,
  paramValue: string | undefined,
  fallback: string,
): string {
  if (!enabled || !isEN) return fallback;
  if (typeof paramValue === "string" && paramValue.trim().length > 0) return paramValue;
  return fallback;
}
