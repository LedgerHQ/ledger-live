import { useMemo } from "react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";
import { UseBalanceDeps, CreateBalanceItem } from "../utils/type";
import { CurrenciesByProviderId } from "../../deposit/type";
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
  // Helper to build provider currencies map from currenciesByProvider array
  const buildProviderCurrenciesMap = (currenciesByProvider: CurrenciesByProviderId[]) => {
    if (!currenciesByProvider || currenciesByProvider.length === 0) {
      return null;
    }

    const providerMap = new Map<
      string,
      { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
    >();

    for (const provider of currenciesByProvider) {
      const { providerId, currenciesByNetwork } = provider;
      if (currenciesByNetwork.length > 0) {
        const mainCurrency =
          currenciesByNetwork.find(c => c.id === providerId) ?? currenciesByNetwork[0];
        providerMap.set(providerId, {
          mainCurrency,
          currencies: currenciesByNetwork,
        });
      }
    }

    return providerMap;
  };

  // Helper to get provider currency from mainCurrency and currencies
  const getProviderCurrency = (
    mainCurrency: CryptoOrTokenCurrency,
    currencies: CryptoOrTokenCurrency[],
  ): CryptoOrTokenCurrency | null => {
    // Try to find the main currency in the currencies list
    const found = currencies.find(c => c.id === mainCurrency.id);
    if (found) return found;

    // Otherwise return the first currency or the main currency
    return currencies[0] ?? mainCurrency;
  };

  const yieldProviderResult = (
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

  return function useRightBalanceAsset(
    assets: CryptoOrTokenCurrency[],
    currenciesByProvider: CurrenciesByProviderId[],
  ) {
    const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

    const grouped = useMemo(
      () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency),
      [flattenedAccounts, state, counterValueCurrency],
    );

    const providerMap = useMemo(
      () => buildProviderCurrenciesMap(currenciesByProvider),
      [currenciesByProvider],
    );

    return useMemo(() => {
      if (!providerMap) {
        const balanceMap = new Map<
          string,
          {
            currency?: CryptoOrTokenCurrency;
            balance?: BigNumber;
            fiatValue?: number;
          }
        >();

        for (const [, { currencies, mainCurrency }] of assetsMap) {
          const { totalBalance, totalFiatValue } = calculateProviderTotals(currencies, grouped);

          const providerResult = yieldProviderResult(mainCurrency, totalBalance, totalFiatValue);

          balanceMap.set(mainCurrency.id, providerResult);
        }

        const assetsWithBalanceData = assets.map(asset => {
          const assetGroup = grouped[asset.id];
          const balanceData = assetGroup
            ? {
                currency: asset,
                balance: assetGroup.totalBalance,
                fiatValue: assetGroup.totalFiatValue.toNumber(),
              }
            : {};
          return { asset, balanceData };
        });

        assetsWithBalanceData.sort((a, b) =>
          compareByBalanceThenFiat(a.balanceData, b.balanceData),
        );

        return assetsWithBalanceData.map(({ asset, balanceData }) => ({
          ...asset,
          rightElement: balanceItem(balanceData),
        }));
      }

      const providerResultsMap = new Map<
        string,
        {
          currency?: CryptoOrTokenCurrency;
          balance?: BigNumber;
          fiatValue?: number;
        }
      >();

      const assetsSet = new Set(assets.map(asset => asset.id));

      for (const [, { currencies, mainCurrency }] of providerMap) {
        if (!assetsSet.has(mainCurrency.id)) continue;
        const providerCurrency = getProviderCurrency(mainCurrency, currencies);
        if (!providerCurrency) continue;

        const { totalBalance, totalFiatValue, hasAccounts } = calculateProviderTotals(
          currencies,
          grouped,
        );
        if (!hasAccounts) continue;

        const providerResult = yieldProviderResult(providerCurrency, totalBalance, totalFiatValue);
        providerResultsMap.set(mainCurrency.id, providerResult);
      }

      const assetsWithBalanceData = assets.map(asset => {
        const balanceData = providerResultsMap.get(asset.id) || {};
        return { asset, balanceData };
      });

      assetsWithBalanceData.sort((a, b) => compareByBalanceThenFiat(a.balanceData, b.balanceData));

      return assetsWithBalanceData.map(({ asset, balanceData }) => ({
        ...asset,
        rightElement: balanceItem(balanceData),
      }));
    }, [providerMap, assets, grouped]);
  };
}
