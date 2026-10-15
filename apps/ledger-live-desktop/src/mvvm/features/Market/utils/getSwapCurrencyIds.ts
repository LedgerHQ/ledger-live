export const getNetworkId = (ledgerId: string) => ledgerId.split("/")[0];

export function getSwapCurrencyIds(
  ledgerIds: readonly string[] | undefined,
  swappableIds: readonly string[],
  deactivatedCurrencyIds: ReadonlySet<string>,
): string[] | undefined {
  if (!ledgerIds) return undefined;
  const swappable = new Set(swappableIds);
  return ledgerIds.filter(id => swappable.has(id) && !deactivatedCurrencyIds.has(getNetworkId(id)));
}
