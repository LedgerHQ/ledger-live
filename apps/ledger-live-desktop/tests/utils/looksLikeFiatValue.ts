const FIAT_ISO_CODES = new Set<string>(Intl.supportedValuesOf("currency"));

/**
 * Heuristic for send amount step: whether the secondary line looks like fiat (vs crypto).
 */
export function looksLikeFiatValue(value: string): boolean {
  if (!value) return false;
  // Fiat amounts start with a non-digit character (currency symbol, e.g. "$0.10", "€0.10")
  if (/^[^\d\s,.+-]/.test(value)) return true;
  // Fiat amounts may end with an ISO 4217 code as a standalone word (e.g. "0.10 USD")
  const lastToken = value.trim().split(/\s+/).pop() ?? "";
  return FIAT_ISO_CODES.has(lastToken);
}
