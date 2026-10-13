export function getSwapCurrencyIds(
  ledgerIds: readonly string[] | undefined,
  swappableIds: readonly string[],
  deactivatedCurrencyIds: ReadonlySet<string>,
): string[] | undefined {
  if (!ledgerIds) return undefined;
  const swappable = new Set(swappableIds);
  return ledgerIds.filter(id => swappable.has(id) && !deactivatedCurrencyIds.has(id.split("/")[0]));
}
