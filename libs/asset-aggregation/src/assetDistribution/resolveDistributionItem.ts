import type { DistributionItem } from "@ledgerhq/types-live";
import { toSlug } from "./toSlug";

export type DistributionLookup = {
  bySlug?: Record<string, DistributionItem>;
  list: DistributionItem[];
};

export type MarketStateSlice = { ledgerIds?: string[] } | undefined;

export type ResolveDistributionItemParams = {
  /** The id (or slug) coming from the route / caller. */
  routeAssetId: string | undefined;
  /** Optional URI-decoded version of `routeAssetId`. Defaults to `routeAssetId`. */
  decodedAssetId?: string;
  /**
   * Optional market-state hint: when the caller knows a related Ledger currency id
   * (e.g. from a market detail screen), it can be passed here to widen the lookup.
   */
  marketState?: MarketStateSlice;
  distribution: DistributionLookup;
};

/**
 * Finds the `DistributionItem` that represents the focused asset in an
 * aggregated portfolio distribution.
 *
 * Tries — in order:
 *  1. `distribution.bySlug[decoded]` (decoded route id used as a slug)
 *  2. `distribution.bySlug[toSlug(marketLedgerId)]` (only when a market hint is given)
 *  3. `list.find(item => item.currency.id matches)` (primary currency match)
 *  4. `list.find(item => item.networks contains a matching id)` (network-specific id)
 *
 * Returns `undefined` if no item matches — the asset is not in the portfolio.
 */
export function resolveDistributionItem({
  routeAssetId,
  decodedAssetId,
  marketState,
  distribution,
}: ResolveDistributionItemParams): DistributionItem | undefined {
  if (!routeAssetId) return undefined;
  const decoded = decodedAssetId ?? routeAssetId;
  const marketLedgerId = marketState?.ledgerIds?.[0];
  const targetIds = new Set(
    [decoded, marketLedgerId].filter((id): id is string => id != null).map(id => id.toLowerCase()),
  );
  const matchesId = (id: string): boolean => targetIds.has(id.toLowerCase());

  return (
    distribution.bySlug?.[decoded] ??
    (marketLedgerId ? distribution.bySlug?.[toSlug(marketLedgerId)] : undefined) ??
    distribution.list.find(item => matchesId(item.currency.id)) ??
    distribution.list.find(item => item.networks?.some(n => matchesId(n.currency.id)))
  );
}
