import { useMemo } from "react";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useStablecoinTickers } from "@ledgerhq/live-common/dada-client/hooks/useStablecoinTickers";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import VersionNumber from "react-native-version-number";
import { Asset } from "~/types/asset";
import { EMPTY_STATE_MAX_ASSETS } from "./usePortfolioCryptosSectionViewModel";

export function useDefaultAssets(isEmptyState: boolean): Asset[] {
  const skip = !isEmptyState;

  const { data: assetsData } = useAssetsData({
    product: "llm",
    version: VersionNumber.appVersion,
    skip,
  });
  const { tickers: stablecoinTickers } = useStablecoinTickers(
    "llm",
    VersionNumber.appVersion,
    skip,
  );

  const assets = useMemo(() => {
    if (!assetsData) return [];

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
  }, [assetsData, stablecoinTickers]);

  // Early return after all hooks — no API data needed outside empty state
  if (!isEmptyState) return [];

  return assets;
}
