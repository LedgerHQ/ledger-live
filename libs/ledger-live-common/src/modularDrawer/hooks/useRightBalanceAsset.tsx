import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { AssetConfigurationOptions } from "../utils/type";
import {
  calculateProviderTotals,
  groupAccountsByAsset,
} from "@ledgerhq/asset-aggregation/assetAggregation/index";

const formatProviderResult = (
  providerCurrency: CryptoOrTokenCurrency,
  totalBalance: BigNumber,
  totalFiatValue: BigNumber,
) => ({
  currency: providerCurrency,
  balance: totalBalance,
  fiatValue: totalFiatValue.toNumber(),
});

export function useRightBalanceAsset(
  assets: CryptoOrTokenCurrency[],
  {
    useBalanceDeps,
    balanceItem,
    assetsMap,
  }: Pick<AssetConfigurationOptions, "useBalanceDeps" | "balanceItem" | "assetsMap">,
) {
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

      const currencyToUse = referenceCurrency || mainCurrency;
      const balanceData = formatProviderResult(currencyToUse, totalBalance, totalFiatValue);

      balanceMap.set(mainCurrency.id, balanceData);
    }

    return assets.map(asset => {
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
  }, [assets, assetsMap, balanceItem, grouped]);
}
