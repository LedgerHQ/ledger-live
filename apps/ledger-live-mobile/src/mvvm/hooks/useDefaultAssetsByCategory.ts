import { useMemo } from "react";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import VersionNumber from "react-native-version-number";
import { Asset } from "~/types/asset";

interface DefaultAssets {
  cryptos: Asset[];
  stablecoins: Asset[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: DefaultAssets = { cryptos: [], stablecoins: [], isLoading: false, isError: false };

/**
 * Fetches placeholder assets from the DADA API and splits them into cryptos and
 * stablecoins in a single pass
 */
export function useDefaultAssetsByCategory(
  enabled: boolean,
  stablecoinTickers: Set<string>,
  maxCryptos: number,
  maxStablecoins: number,
): DefaultAssets {
  const appVersion = VersionNumber.appVersion ?? "";

  const {
    data: assetsData,
    isLoading,
    isError,
  } = useAssetsData({
    product: "llm",
    version: appVersion,
    skip: !enabled,
  });

  const defaults = useMemo<DefaultAssets>(() => {
    if (!assetsData) return { cryptos: [], stablecoins: [], isLoading, isError };

    const cryptos: Asset[] = [];
    const stablecoins: Asset[] = [];

    for (const id of assetsData.currenciesOrder.metaCurrencyIds) {
      if (cryptos.length >= maxCryptos && stablecoins.length >= maxStablecoins) break;

      const currency = selectCurrencyForMetaId(id, assetsData);
      if (!currency) continue;

      const ticker = assetsData.cryptoAssets[id]?.ticker?.toUpperCase() ?? "";
      const { id: marketId } = assetsData.markets?.[currency.id] ?? {};
      const item: Asset = {
        currency,
        accounts: [],
        amount: 0,
        isPlaceholder: true,
        marketId: marketId ?? id,
      };

      if (stablecoinTickers.has(ticker)) {
        if (stablecoins.length < maxStablecoins) stablecoins.push(item);
      } else if (cryptos.length < maxCryptos) {
        cryptos.push(item);
      }
    }

    return { cryptos, stablecoins, isLoading, isError };
  }, [assetsData, isLoading, isError, stablecoinTickers, maxCryptos, maxStablecoins]);

  if (!enabled) return EMPTY;

  return defaults;
}
