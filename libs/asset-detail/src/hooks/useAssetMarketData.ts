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
    { skip: !effectiveLedgerIds?.length },
  );

  const dadaMarket = effectiveLedgerIds?.[0]
    ? assetData?.markets[effectiveLedgerIds[0]]
    : undefined;

  const { status: rateStatus, rate } = useUsdToFiatRate(counterCurrency);

  const marketCurrencyData = useMemo<MarketCurrencyData | undefined>(() => {
    if (dadaMarket) {
      const formattedDadaMarket = format(dadaMarket as MarketItemResponse);
      if (rateStatus === "ready" && rate != null) {
        return applyUsdRateToMarket(formattedDadaMarket, rate);
      }
      // Return USD-formatted data while rate is loading/errored, instead of falling back to undefined
      return formattedDadaMarket;
    }
    return marketFromHook;
  }, [dadaMarket, marketFromHook, rateStatus, rate]);

  const ledgerCurrencyFromDada = useMemo(
    () => (assetData ? selectCurrency(assetData) : undefined),
    [assetData],
  );

  return {
    marketCurrencyData,
    marketId: marketFromHook?.id ?? knownMarketId,
    ledgerCurrencyFromDada,
    isLoading: isLoadingMarket || isLoadingDada || (!!dadaMarket && rateStatus === "loading"),
    isError: isErrorMarket || isErrorDada || (!!dadaMarket && rateStatus === "error"),
  };
}
