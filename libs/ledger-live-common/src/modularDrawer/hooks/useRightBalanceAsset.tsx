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

export function createUseRightBalanceAsset({ useBalanceDeps, balanceItem, assetsMap }: AssetDeps) {
  const formatProviderResult = (
    providerCurrency: CryptoOrTokenCurrency,
    totalBalance: BigNumber,
    totalFiatValue: BigNumber,
  ) => {
    return {
      currency: providerCurrency,
      balance: totalBalance,
      fiatValue: totalFiatValue.toNumber(),
    };
  };

  return function useRightBalanceAsset(assets: CryptoOrTokenCurrency[]) {
    const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

    const grouped = useMemo(
      () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency),
      [flattenedAccounts, state, counterValueCurrency],
    );

    return useMemo(() => {
      const balanceMap = new Map();

      for (const [, { currencies, mainCurrency }] of assetsMap) {
        const { totalBalance, totalFiatValue, referenceCurrency } = calculateProviderTotals(
          currencies,
          grouped,
        );

        // Use referenceCurrency from actual accounts if available, fallback to mainCurrency
        const currencyToUse = referenceCurrency || mainCurrency;
        const balanceData = formatProviderResult(currencyToUse, totalBalance, totalFiatValue);

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
    }, [assets, grouped]);
  };
}
