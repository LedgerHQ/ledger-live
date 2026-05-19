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
import type { AssetMarketDataInput, AssetMarketDataResult } from "../types";

export function useAssetMarketData({
  marketApiCurrencyId,
  knownLedgerIds,
  counterCurrency,
  product,
  version,
  isStaging = false,
}: AssetMarketDataInput): AssetMarketDataResult {
  const {
    data: marketFromHook,
    isLoading: isLoadingMarket,
    isError: isErrorMarket,
  } = useGetCurrencyDataQuery(
    { id: marketApiCurrencyId ?? "", counterCurrency },
    {
      skip: !marketApiCurrencyId,
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
    { skip: !effectiveLedgerIds?.length },
  );

  const dadaMarket = effectiveLedgerIds?.[0]
    ? assetData?.markets[effectiveLedgerIds[0]]
    : undefined;

  // DADA always returns USD prices; convert with the user's selected fiat rate.
  // While the rate is loading or errored we fall back to `marketFromHook`
  // (already in user fiat via `getCurrencyData`) so we never display USD.
  const rateState = useUsdToFiatRate(counterCurrency);

  const marketCurrencyData = useMemo<MarketCurrencyData | undefined>(() => {
    if (dadaMarket && rateState.status === "ready") {
      return applyUsdRateToMarket(format(dadaMarket as MarketItemResponse), rateState.rate);
    }
    return marketFromHook;
  }, [dadaMarket, marketFromHook, rateState]);

  const ledgerCurrencyFromDada = useMemo(
    () => (assetData ? selectCurrency(assetData) : undefined),
    [assetData],
  );

  return {
    marketCurrencyData,
    ledgerCurrencyFromDada,
    isLoading: isLoadingMarket || isLoadingDada || (!!dadaMarket && rateState.status === "loading"),
    isError: isErrorMarket || isErrorDada,
  };
}
