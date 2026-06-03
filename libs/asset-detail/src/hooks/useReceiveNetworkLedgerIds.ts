import { useMemo } from "react";
import { toSlug } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import type { ReceiveNetworkLedgerIdsInput } from "../types";

type MetaHints = Pick<
  ReceiveNetworkLedgerIdsInput,
  "metaCurrencyId" | "marketApiId" | "currencyId"
>;

/**
 * Resolves the meta-currency network list from the search payload, trying the
 * exact meta id first (held asset), then the meta whose canonical slug matches
 * the market id (not held), then scanning for the meta that contains a known
 * currency id.
 */
export function resolveNetworkLedgerIds(
  data: AssetsDataWithPagination | undefined,
  { metaCurrencyId, marketApiId, currencyId }: MetaHints,
): string[] {
  if (!data) return [];

  const exactMeta = metaCurrencyId ? data.cryptoAssets[metaCurrencyId] : undefined;
  if (exactMeta) return Object.values(exactMeta.assetsIds);

  let currencyMatch: string[] | undefined;
  for (const [metaId, meta] of Object.entries(data.cryptoAssets)) {
    const ledgerIds = Object.values(meta.assetsIds);
    if (marketApiId && toSlug(metaId) === marketApiId) return ledgerIds;
    if (!currencyMatch && currencyId && ledgerIds.includes(currencyId)) currencyMatch = ledgerIds;
  }

  return currencyMatch ?? [];
}

/**
 * Resolves a token meta-currency's full network list so a receive flow can offer
 * every network, including ones not held yet.
 *
 * CoinGecko's `ledgerIds` is unreliable for tokens (partial or collapsed), so we
 * query DADA — the source of truth — and keep its list only when more complete.
 * Platform-agnostic: callers inject `product`, `version` and the DADA env flags.
 */
export function useReceiveNetworkLedgerIds({
  metaCurrencyId,
  marketApiId,
  ticker,
  currencyId,
  fallbackLedgerIds,
  product,
  version,
  isStaging = false,
  includeTestNetworks = false,
}: ReceiveNetworkLedgerIdsInput): string[] {
  // DADA owns the complete network list, so query it whenever we can identify the meta.
  const shouldResolve = Boolean(ticker && (metaCurrencyId || marketApiId || currencyId));

  const { data } = useAssetsData({
    search: ticker,
    product,
    version,
    areCurrenciesFiltered: false,
    isStaging,
    includeTestNetworks,
    skip: !shouldResolve,
  });

  return useMemo(() => {
    if (!shouldResolve) return fallbackLedgerIds;
    const ledgerIds = resolveNetworkLedgerIds(data, { metaCurrencyId, marketApiId, currencyId });
    // Keep DADA's list only when it is more complete than the fallback.
    return ledgerIds.length > fallbackLedgerIds.length ? ledgerIds : fallbackLedgerIds;
  }, [shouldResolve, data, metaCurrencyId, marketApiId, currencyId, fallbackLedgerIds]);
}
