import { useMemo, type ReactNode } from "react";
import type { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { counterValueFormatter } from "../utils/counterValueFormatter";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps } from "../utils/type";
import { calculateProviderTotals } from "../utils/calculateProviderTotal";
import { groupAccountsByAsset } from "../utils/groupAccountsByAsset";

export type AssetDeps = {
  useBalanceDeps: UseBalanceDeps;
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
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
    counterValueCurrency: Currency,
    locale: string,
    discreet: boolean,
  ) => {
    const unit = providerCurrency.units?.[0];
    const balance = unit
      ? formatCurrencyUnit(unit, totalBalance, { showCode: true, discreet })
      : `${totalBalance.toFixed()} ${providerCurrency.ticker ?? providerCurrency.symbol}`;
    const fiatValue = counterValueFormatter({
      currency: counterValueCurrency.ticker,
      value: totalFiatValue.toNumber(),
      locale,
      allowZeroValue: true,
    });
    return { balance, fiatValue };
  };

  return function useRightBalanceAsset(assets: CryptoOrTokenCurrency[]) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    const grouped = useMemo(
      () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency, discreet),
      [flattenedAccounts, state, counterValueCurrency, discreet],
    );

    return useMemo(() => {
      const balanceMap = new Map();

      for (const [, { currencies, mainCurrency }] of assetsMap) {
        const { totalBalance, totalFiatValue } = calculateProviderTotals(currencies, grouped);

        const { balance, fiatValue } = formatProviderResult(
          mainCurrency,
          totalBalance,
          totalFiatValue,
          counterValueCurrency,
          locale,
          discreet,
        );

        balanceMap.set(mainCurrency.id, {
          balance: balance,
          fiatValue: fiatValue,
        });
      }

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
    }, [assets, grouped, counterValueCurrency, locale, discreet]);
  };
}
