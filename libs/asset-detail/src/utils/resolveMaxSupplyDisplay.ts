export const INFINITE_SUPPLY_SYMBOL = "∞";
export const MISSING_VALUE = "-";

type ResolveMaxSupplyDisplayParams = {
  maxSupply: number | undefined;
  circulatingSupply: number | undefined;
  formatValue: (value: number) => string;
};

/**
 * Resolve what to display for the "Max Supply" market stat.
 *
 * A coin without a supply cap (e.g. ETH, DOGE) reports no `maxSupply`, which is
 * an infinite max supply. We only treat a missing `maxSupply` as infinite when
 * market data is actually loaded — detected via `circulatingSupply` — otherwise
 * the value is simply unknown and we keep the missing-value placeholder.
 */
export function resolveMaxSupplyDisplay({
  maxSupply,
  circulatingSupply,
  formatValue,
}: ResolveMaxSupplyDisplayParams): string {
  if (maxSupply) return formatValue(maxSupply);
  if (circulatingSupply) return INFINITE_SUPPLY_SYMBOL;
  return MISSING_VALUE;
}
