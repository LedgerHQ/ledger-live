import type { ReactNode } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps } from "../utils/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";

export type AssetDeps = {
  useBalanceDeps: UseBalanceDeps;
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
};

export function createUseRightBalanceAsset({ useBalanceDeps, balanceItem }: AssetDeps) {
  return function useRightBalanceAsset(assets: CryptoOrTokenCurrency[]) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    const allBalance = getBalanceAndFiatValueByAssets(
      flattenedAccounts,
      assets,
      state,
      counterValueCurrency,
      discreet,
      locale,
    );
    const balanceMap = new Map(allBalance.map(b => [b.id, b]));
    const assetsWithBalanceData = assets.map(asset => {
      const balanceData = balanceMap.get(asset.id) || {};
      return {
        asset,
        balanceData,
      };
    });

    assetsWithBalanceData.sort((a, b) =>
      compareByBalanceThenFiat(a.balanceData, b.balanceData, discreet),
    );

    return assetsWithBalanceData.map(({ asset, balanceData }) => ({
      ...asset,
      rightElement: balanceItem(balanceData),
    }));
  };
}
