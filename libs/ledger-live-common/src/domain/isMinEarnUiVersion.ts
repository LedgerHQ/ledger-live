import { EarnUiVersion, normalizeEarnUiVersionOrNull } from "./earnUiVersion";

const DEFAULT: EarnUiVersion = "v1";

/**
 * Integer-based minimum version check for the ptxEarnUi feature flag.
 * Coerces inputs — accepts "v2", "2", or the number 2. Invalid or nullish `actual` is treated as "v1"
 * (same as the ptxEarnUi flag schema). Invalid `minimum` yields false.
 */
export function isMinEarnUiVersion(
  actual: string | number | null | undefined,
  minimum: string | number,
): boolean {
  const a = normalizeEarnUiVersionOrNull(actual) ?? DEFAULT;

  const b = normalizeEarnUiVersionOrNull(minimum);
  if (b === null) return false;

  return Number.parseInt(a.slice(1), 10) >= Number.parseInt(b.slice(1), 10);
}
