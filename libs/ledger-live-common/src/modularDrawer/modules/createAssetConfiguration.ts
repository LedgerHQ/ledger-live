import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  AssetType,
  AssetConfigurationOptions,
  AssetRightElementKind,
  BalanceUI,
} from "../utils/type";
import { useRightBalanceAsset } from "../hooks/useRightBalanceAsset";
import { useRightMarketTrendModule } from "../hooks/modules/useRightMarketTrendModule";
import { useLeftApyModule } from "../hooks/modules/useLeftApyModule";
import { useLeftMarketTrendModule } from "../hooks/modules/useLeftMarketTrendModule";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";

type AssetComponentProps = Partial<
  AssetType & {
    balanceData?: BalanceUI;
  }
>;

export type AssetWithComponents = CryptoOrTokenCurrency &
  AssetType & {
    balanceData?: BalanceUI;
  };

export const sortAssets = (result: AssetWithComponents[], rightElement?: AssetRightElementKind) => {
  if (rightElement === "balance" || rightElement === undefined) {
    return [...result].sort((a, b) => compareByBalanceThenFiat(a?.balanceData, b?.balanceData));
  }
  return result;
};

export function useAssetConfiguration(
  assets: CryptoOrTokenCurrency[],
  options: AssetConfigurationOptions,
): AssetWithComponents[] {
  const { rightElement = "balance", leftElement } = options;

  const rightResults: Record<string, AssetComponentProps[]> = {
    balance: useRightBalanceAsset(
      rightElement === "balance" || rightElement === undefined ? assets : [],
      options,
    ),
    marketTrend: useRightMarketTrendModule(rightElement === "marketTrend" ? assets : [], options),
  };
  const leftResults: Record<string, AssetComponentProps[]> = {
    apy: useLeftApyModule(leftElement === "apy" ? assets : [], options),
    marketTrend: useLeftMarketTrendModule(leftElement === "marketTrend" ? assets : [], options),
  };

  const merged = assets.map<AssetWithComponents>((asset, i) => ({
    ...asset,
    ...rightResults[rightElement]?.[i],
    ...leftResults[leftElement ?? ""]?.[i],
  }));

  return sortAssets(merged, rightElement);
}
