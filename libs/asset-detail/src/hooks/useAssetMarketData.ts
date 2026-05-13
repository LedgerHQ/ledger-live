import { useMemo } from "react";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { format } from "@ledgerhq/live-common/market/utils/currencyFormatter";
import type {
  MarketCurrencyData,
  MarketItemResponse,
} from "@ledgerhq/live-common/market/utils/types";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
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

  const marketCurrencyData = useMemo<MarketCurrencyData | undefined>(() => {
    if (dadaMarket) return format(dadaMarket as MarketItemResponse);
    return marketFromHook;
  }, [dadaMarket, marketFromHook]);

  const ledgerCurrencyFromDada = useMemo(
    () => (assetData ? selectCurrency(assetData) : undefined),
    [assetData],
  );

  return {
    marketCurrencyData,
    ledgerCurrencyFromDada,
    isLoading: isLoadingMarket || isLoadingDada,
    isError: isErrorMarket || isErrorDada,
  };
}
