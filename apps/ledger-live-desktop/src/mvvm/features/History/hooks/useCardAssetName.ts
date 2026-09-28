import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import { useCurrenciesByIds } from "@features/platform-currencies";

const NO_IDS: readonly string[] = [];

/**
 * The name to show beside "Card" for a `?asset=` scoped history.
 *
 * The URL carries the provider's asset code alone, so the name is resolved here from the same
 * currency the asset row reads it from — a name in the query string could be stale, or be a
 * caller's own wording, and the header would contradict the list it scopes.
 *
 * Falls back to the upper-cased code, as the asset row does, for an asset the catalog does not
 * cover and for a token whose CAL lookup has not answered yet.
 */
export function useCardAssetName(assetCode: string | undefined): string | undefined {
  // A ticker-only `?asset=usdc` is the pair `usdc.usdc`, which the catalog lists.
  const ledgerId = assetCode ? baanxAssetLedgerId(assetCode, assetCode) : undefined;
  const currencies = useCurrenciesByIds(ledgerId ? [ledgerId] : NO_IDS);

  if (!assetCode) return undefined;

  return (ledgerId && currencies.get(ledgerId)?.name) || assetCode.toUpperCase();
}
