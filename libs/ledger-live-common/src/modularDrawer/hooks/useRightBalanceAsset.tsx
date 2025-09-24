import { useMemo, type ReactNode } from "react";
import type { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps } from "../utils/type";
import { groupAccountsByAsset, GroupedAccount } from "../utils/groupAccountsByAsset";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import { counterValueFormatter } from "../utils/counterValueFormatter";

export type AssetDeps = {
  useBalanceDeps: UseBalanceDeps;
  balanceItem: (asset: { fiatValue?: string; balance?: string }) => ReactNode;
  map: Map<string, { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }>;
};

const calculateProviderTotals = (
  currencies: CryptoOrTokenCurrency[],
  groupedAccountsByAsset: Record<string, GroupedAccount>,
) => {
  let totalBalance = new BigNumber(0);
  let totalFiatValue = new BigNumber(0);
  let hasAccounts = false;

  for (const currency of currencies) {
    const assetGroup = groupedAccountsByAsset[currency.id];
    if (assetGroup?.accounts.length > 0) {
      totalBalance = totalBalance.plus(assetGroup.totalBalance);
      totalFiatValue = totalFiatValue.plus(assetGroup.totalFiatValue);
      hasAccounts = true;
    }
  }

  return { totalBalance, totalFiatValue, hasAccounts };
};

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

export function createUseRightBalanceAsset({ useBalanceDeps, balanceItem, map }: AssetDeps) {
  return function useRightBalanceAsset(assets: CryptoOrTokenCurrency[]) {
    const { flattenedAccounts, discreet, state, counterValueCurrency, locale } = useBalanceDeps();

    const grouped = useMemo(
      () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency, discreet),
      [flattenedAccounts, state, counterValueCurrency, discreet],
    );

    const balanceMap = new Map();

    for (const [, { currencies, mainCurrency }] of map) {
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
  };
}
