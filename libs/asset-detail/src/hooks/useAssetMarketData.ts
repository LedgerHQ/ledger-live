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
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { applyDadaMarketFallback } from "../utils/applyDadaMarketFallback";
import type { AssetMarketDataInput, AssetMarketDataResult } from "../types";

export function useAssetMarketData({
  marketApiId,
  knownLedgerIds,
  counterCurrency,
  product,
  version,
  isStaging = false,
  knownMarketId,
}: AssetMarketDataInput): AssetMarketDataResult {
  const {
    data: marketFromHook,
    isLoading: isLoadingMarket,
    isError: isErrorMarket,
  } = useGetCurrencyDataQuery(
    { id: marketApiId ?? "", counterCurrency },
    {
      skip: !marketApiId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const effectiveLedgerIds = useMemo<readonly string[] | undefined>(
    () => knownLedgerIds ?? marketFromHook?.ledgerIds,
    [knownLedgerIds, marketFromHook?.ledgerIds],
  );

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
      skip: !effectiveLedgerIds?.length,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const dadaMarket = effectiveLedgerIds?.[0]
    ? assetData?.markets[effectiveLedgerIds[0]]
    : undefined;

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
    marketId: marketFromHook?.id ?? knownMarketId,
    ledgerCurrencyFromDada,
    ledgerIds,
    isLoading: isLoadingMarket || isLoadingDada || (!!dadaMarket && rateStatus === "loading"),
    isError: isErrorMarket || isErrorDada || (!!dadaMarket && rateStatus === "error"),
  };
}
