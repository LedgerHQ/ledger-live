import { useMemo } from "react";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import VersionNumber from "react-native-version-number";
import { Asset } from "~/types/asset";
import { EMPTY_STATE_MAX_ASSETS } from "./usePortfolioCryptosSectionViewModel";

export interface DefaultAssetsResult {
  assets: Asset[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function useDefaultAssets(isEmptyState: boolean): DefaultAssetsResult {
  const skip = !isEmptyState;

  const {
    data: assetsData,
    isLoading: assetsLoading,
    isError,
    refetch,
  } = useAssetsData({
    product: "llm",
    version: VersionNumber.appVersion,
    skip,
  });
  const { tickers: stablecoinTickers, isLoading: tickersLoading } = useStablecoinTickers(
    "llm",
    VersionNumber.appVersion,
    skip,
  );

  const isLoading = assetsLoading || tickersLoading;

  const assets = useMemo(() => {
    if (!assetsData || isLoading) return [];

    const items: Asset[] = [];
    for (const id of assetsData.currenciesOrder.metaCurrencyIds) {
      if (items.length >= EMPTY_STATE_MAX_ASSETS) break;
      const currency = selectCurrencyForMetaId(id, assetsData);
      if (!currency) continue;

      const ticker = assetsData.cryptoAssets[id]?.ticker?.toUpperCase() ?? "";
      if (stablecoinTickers.has(ticker)) continue;

      const { price, id: marketId } = assetsData.markets?.[currency.id] ?? {};
      items.push({
        currency,
        accounts: [],
        amount: 0,
        countervalue: 0,
        isPlaceholder: true,
        placeholderPrice: price,
        marketId: marketId ?? currency.id,
      });
    }
    return items;
  }, [assetsData, isLoading, stablecoinTickers]);

  // Early return after all hooks — no API data needed outside empty state
  if (!isEmptyState) return { assets: [], isLoading: false, isError: false, onRetry: refetch };

  return { assets, isLoading, isError, onRetry: refetch };
}
