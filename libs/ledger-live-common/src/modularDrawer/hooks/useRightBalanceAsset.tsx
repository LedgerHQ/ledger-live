import { useMemo } from "react";
import type { ReactNode } from "react";
import type { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { counterValueFormatter } from "../utils/counterValueFormatter";
import { compareByHasThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps } from "../utils/type";
import { buildProviderCurrenciesMap } from "../utils/buildProviderCurrenciesMap";
import { CurrenciesByProviderId } from "../../deposit/type";
import { calculateProviderTotals } from "../utils/calculateProviderTotal";
import { getProviderCurrency } from "../utils/getProviderCurrency";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";
import { groupAccountsByAsset } from "../utils/groupAccountsByAsset";

export type AssetDeps = {
  useBalanceDeps: UseBalanceDeps;
  createBalanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
};

export function createUseRightBalanceAsset({ useBalanceDeps, createBalanceItem }: AssetDeps) {
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

  return function useRightBalanceAsset(
    assets: CryptoOrTokenCurrency[],
    currenciesByProvider: CurrenciesByProviderId[],
  ) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    const grouped = useMemo(
      () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency, discreet),
      [flattenedAccounts, state, counterValueCurrency, discreet],
    );

    const providerMap = useMemo(
      () => buildProviderCurrenciesMap(currenciesByProvider),
      [currenciesByProvider],
    );

    return useMemo(() => {
      if (!providerMap) {
        const allBalance = getBalanceAndFiatValueByAssets(
          flattenedAccounts,
          assets,
          state,
          counterValueCurrency,
          discreet,
          locale,
        );
        const balanceMap = new Map(allBalance.map(b => [b.id, b]));
        const rows = assets.map(asset => {
          const balanceData = balanceMap.get(asset.id) || {};
          return {
            ...asset,
            rightElement: createBalanceItem(balanceData),
            balanceData,
          };
        });

        rows.sort((a, b) => compareByHasThenFiat(a.balanceData, b.balanceData, discreet));

        return rows.map(({ balanceData, ...rest }) => rest);
      }

      const assetsSet = new Set(assets.map(a => a.id));
      const providerResultsMap = new Map<string, { balance?: string; fiatValue?: string }>();

      for (const [, { currencies, mainCurrency }] of providerMap) {
        if (!assetsSet.has(mainCurrency.id)) continue;
        const providerCurrency = getProviderCurrency(mainCurrency, currencies);
        if (!providerCurrency) continue;

        const { totalBalance, totalFiatValue, hasAccounts } = calculateProviderTotals(
          currencies,
          grouped,
        );
        if (!hasAccounts) continue;

        const { balance, fiatValue } = formatProviderResult(
          providerCurrency,
          totalBalance,
          totalFiatValue,
          counterValueCurrency,
          locale,
          discreet,
        );
        providerResultsMap.set(mainCurrency.id, { balance, fiatValue });
      }

      const rows = assets.map(asset => {
        const balanceData = providerResultsMap.get(asset.id) || {};
        return {
          ...asset,
          rightElement: createBalanceItem(balanceData),
          balanceData,
        };
      });

      rows.sort((a, b) => compareByHasThenFiat(a.balanceData, b.balanceData, discreet));

      return rows.map(({ balanceData, ...rest }) => rest);
    }, [
      assets,
      providerMap,
      flattenedAccounts,
      state,
      counterValueCurrency,
      discreet,
      locale,
      grouped,
    ]);
  };
}
