import { useMemo } from "react";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { format } from "@ledgerhq/live-common/market/utils/currencyFormatter";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";
import type {
  MarketCurrencyData,
  MarketItemResponse,
} from "@ledgerhq/live-common/market/utils/types";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { applyDadaMarketFallback } from "../utils/applyDadaMarketFallback";
import { resolveDadaMarket } from "../utils/resolveDadaMarket";
import {
  buildMarketCurrencyQueryArgs,
  resolveCoingeckoIdForIdsQuery,
} from "../utils/resolveMarketCurrencyQuery";
import type { AssetMarketDataInput, AssetMarketDataResult } from "../types";

export function useAssetMarketData({
  marketApiId,
  knownLedgerIds,
  counterCurrency,
  product,
  version,
  isStaging = false,
  knownMarketId,
  enabled = true,
}: AssetMarketDataInput): AssetMarketDataResult {
  const { args: currencyQueryArgs, skip: skipMarketQueryBase } = useMemo(
    () => buildMarketCurrencyQueryArgs({ marketApiId, knownLedgerIds, counterCurrency }),
    [marketApiId, knownLedgerIds, counterCurrency],
  );

  const skipMarketQuery = !enabled || skipMarketQueryBase;

  const {
    data: marketFromHook,
    isLoading: isLoadingMarket,
    isError: isErrorMarket,
  } = useGetCurrencyDataQuery(currencyQueryArgs, {
    skip: skipMarketQuery,
    pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
  });

  const effectiveLedgerIds = useMemo<readonly string[] | undefined>(
    () => knownLedgerIds ?? marketFromHook?.ledgerIds,
    [knownLedgerIds, marketFromHook?.ledgerIds],
  );

  // Shared bulk DADA cache: same query args as the Assets table / Global Search so the
  // displayed price reads the exact same entry — no transient drift. `isStaging` is
  // normalized to `undefined` (not `false`) to keep the same cache key those screens use.
  const { data: bulkData } = useAssetsData({
    product,
    version,
    isStaging: isStaging || undefined,
    skip: !enabled,
    pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    skipPollingIfUnfocused: true,
  });

  const {
    data: assetData,
    isLoading: isLoadingDada,
    isError: isErrorDada,
  } = assetsDataApi.useGetAssetDataQuery(
    {
      currencyIds: effectiveLedgerIds ? [...effectiveLedgerIds] : [],
      product,
      version,
      isStaging,
    },
    {
      skip: !enabled || !effectiveLedgerIds?.length,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  // The per-asset query stays subscribed even when the bulk entry wins: it supplies
  // `ledgerCurrencyFromDada` (used for un-held assets) and the fallback market entry.
  const dadaMarket = resolveDadaMarket(effectiveLedgerIds, bulkData, assetData);

  const { status: rateStatus, rate } = useUsdToFiatRate(counterCurrency);

  const marketCurrencyData = useMemo<MarketCurrencyData | undefined>(() => {
    if (dadaMarket) {
      const formattedDadaMarket = format(dadaMarket as MarketItemResponse);
      const merged = applyDadaMarketFallback(formattedDadaMarket, marketFromHook);
      if (rateStatus === "ready" && rate != null) {
        return applyUsdRateToMarket(merged, rate);
      }
      // Return USD-formatted data while rate is loading/errored, instead of falling back to undefined
      return merged;
    }
    return marketFromHook;
  }, [dadaMarket, marketFromHook, rateStatus, rate]);

  const ledgerCurrencyFromDada = useMemo(
    () => (assetData ? selectCurrency(assetData) : undefined),
    [assetData],
  );

  // CoinGecko's response carries the full multi-network list. `marketCurrencyData`
  // can lose it when the DADA branch wins (its `ledgerIds` is scoped to a single
  // id), so prefer `marketFromHook?.ledgerIds` and fall back to whatever's left.
  const ledgerIds = useMemo<string[]>(() => {
    if (marketFromHook?.ledgerIds?.length) return marketFromHook.ledgerIds;
    if (marketCurrencyData?.ledgerIds?.length) return marketCurrencyData.ledgerIds;
    return knownLedgerIds ? [...knownLedgerIds] : [];
  }, [marketFromHook?.ledgerIds, marketCurrencyData?.ledgerIds, knownLedgerIds]);

  return {
    marketCurrencyData,
    marketId: marketFromHook?.id ?? resolveCoingeckoIdForIdsQuery(knownMarketId),
    ledgerCurrencyFromDada,
    ledgerIds,
    isLoading: isLoadingMarket || isLoadingDada || (!!dadaMarket && rateStatus === "loading"),
    isError: isErrorMarket || isErrorDada || (!!dadaMarket && rateStatus === "error"),
  };
}
