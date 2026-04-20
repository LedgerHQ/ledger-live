type EarnUiVersion = `v${number}`;
const DEFAULT_EARN_UI_VERSION: EarnUiVersion = "v1";

function coerceEarnUiVersion(value: string): EarnUiVersion | null {
  const bare = value.startsWith("v") ? value.slice(1) : value;
  const n = Number(bare);
  return Number.isInteger(n) && n > 0 ? `v${n}` : null;
}

/**
 * Integer-based minimum version check for the ptxEarnUi feature flag.
 * Coerces both values (accepts "v2" or "2" style), falls back to "v1" when actual is nullish.
 */
export function isMinEarnUiVersion(actual: string | null | undefined, minimum: string): boolean {
  const a = coerceEarnUiVersion(actual ?? DEFAULT_EARN_UI_VERSION);
  const b = coerceEarnUiVersion(minimum);
  if (!a || !b) return false;
  return Number.parseInt(a.slice(1), 10) >= Number.parseInt(b.slice(1), 10);
}
