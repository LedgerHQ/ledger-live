import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps, CreateBalanceItem } from "../utils/type";
import { calculateProviderTotals } from "../utils/calculateProviderTotal";
import { groupAccountsByAsset } from "../utils/groupAccountsByAsset";

export type AssetDeps = {
  useBalanceDeps: UseBalanceDeps;
  balanceItem: CreateBalanceItem;
  assetsMap: Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >;
};

export function useRightBalanceAsset({
  assets,
  useBalanceDeps,
  balanceItem,
  assetsMap,
  enabled = true,
}: AssetDeps & { assets: CryptoOrTokenCurrency[]; enabled?: boolean }) {
  const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

  const grouped = useMemo(
    () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency),
    [flattenedAccounts, state, counterValueCurrency],
  );

  return useMemo(() => {
    if (!enabled) return assets;

    const balanceMap = new Map();

    for (const [, { currencies, mainCurrency }] of assetsMap) {
      const { totalBalance, totalFiatValue, referenceCurrency } = calculateProviderTotals(
        currencies,
        grouped,
      );

      // Use referenceCurrency from actual accounts if available, fallback to mainCurrency
      const currencyToUse = referenceCurrency || mainCurrency;
      const balanceData = {
        currency: currencyToUse,
        balance: totalBalance,
        fiatValue: totalFiatValue.toNumber(),
      };

      balanceMap.set(mainCurrency.id, balanceData);
    }

    const assetsWithBalanceData = assets.map(asset => {
      const balanceData = balanceMap.get(asset.id) || {
        currency: asset,
        balance: new BigNumber(0),
        fiatValue: 0,
      };
      return {
        ...asset,
        balanceData,
        rightElement: balanceItem(balanceData),
      };
    });

    return assetsWithBalanceData.sort((a, b) =>
      compareByBalanceThenFiat(a.balanceData, b.balanceData),
    );
  }, [assets, grouped, assetsMap, balanceItem, enabled]);
}
