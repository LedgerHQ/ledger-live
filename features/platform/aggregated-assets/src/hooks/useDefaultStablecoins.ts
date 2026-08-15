import { useMemo } from "react";
import {
  useGetAssetsDataInfiniteQuery,
  AssetCategory,
  mergeAssetsDataPages,
  type WalletApp,
} from "@domain/api-aggregated-assets";
import { useStablecoinTickers } from "./useStablecoinTickers";
import { selectTopAssetsByCategory } from "../discovery";

const STABLECOIN_CATEGORIES = [AssetCategory.Stablecoins];

// Always-offered rows, taken from the top of the market-cap-ordered stablecoins (USDC/USDT).
const DEFAULT_STABLECOIN_COUNT = 2;

/** Always-offered stablecoin (USDC/USDT), derived from the market-cap-ordered DADA list. */
export type DefaultStablecoin = Readonly<{
  id: string;
  ticker: string;
  name: string;
  magnitude: number;
}>;

export type UseDefaultStablecoinsResult = Readonly<{
  defaultStablecoins: DefaultStablecoin[];
  isLoading: boolean;
  isError: boolean;
}>;

/**
 * Resolves the default stablecoin rows (top {@link DEFAULT_STABLECOIN_COUNT} by
 * market cap, e.g. USDC/USDT).
 */
export function useDefaultStablecoins(
  product: WalletApp,
  version: string,
): UseDefaultStablecoinsResult {
  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingTickers,
    isError: isTickersError,
  } = useStablecoinTickers(product, version);

  const {
    data: stablecoinAssets,
    isLoading: isLoadingAssets,
    isError: isAssetsError,
  } = useGetAssetsDataInfiniteQuery({
    categories: STABLECOIN_CATEGORIES,
    product,
    version,
  });

  const defaultStablecoins = useMemo<DefaultStablecoin[]>(() => {
    const merged = mergeAssetsDataPages(stablecoinAssets?.pages);
    if (!merged) return [];
    const { stablecoins: top } = selectTopAssetsByCategory(merged, stablecoinTickers, {
      maxCryptos: 0,
      maxStablecoins: DEFAULT_STABLECOIN_COUNT,
    });
    return top.map(({ currency }) => ({
      id: currency.id,
      ticker: currency.ticker,
      name: currency.name,
      magnitude: currency.units[0]?.magnitude ?? 0,
    }));
  }, [stablecoinAssets, stablecoinTickers]);

  return {
    defaultStablecoins,
    isLoading: isLoadingTickers || isLoadingAssets,
    isError: isTickersError || isAssetsError,
  };
}
