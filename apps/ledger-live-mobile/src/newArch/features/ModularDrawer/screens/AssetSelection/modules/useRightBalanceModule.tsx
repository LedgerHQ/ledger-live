import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import orderBy from "lodash/orderBy";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components/native";
import { counterValueFormatter } from "~/newArch/features/Market/utils";
import { accountsSelector } from "~/reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  localeSelector,
} from "~/reducers/settings";
import { Text } from "@ledgerhq/native-ui/index";
import { groupAccountsByAsset } from "@ledgerhq/live-common/modularDrawer/utils/groupAccountsByAsset";
import {
  ProviderBalanceAsset,
  ProviderBalanceResultsMap,
} from "@ledgerhq/live-common/modularDrawer/utils/type";
import { getBalanceAndFiatValueByAssets } from "@ledgerhq/live-common/modularDrawer/utils/getBalanceAndFiatValueByAssets";
import { getProviderCurrency } from "@ledgerhq/live-common/modularDrawer/utils/getProviderCurrency";
import { calculateProviderTotals } from "@ledgerhq/live-common/modularDrawer/utils/calculateProviderTotal";

const BalanceContainer = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const createBalanceItem = (asset: { fiatValue?: string; balance?: string }) => (
  // @ts-expect-error TypeScript 5.9 styled-components children issue
  <BalanceContainer>
    <Text fontSize="14px" variant="largeLineHeight" fontWeight="semiBold" color="neutral.c100">
      {asset.fiatValue}
    </Text>
    <Text
      fontSize="12px"
      lineHeight="16px"
      variant="bodyLineHeight"
      fontWeight="medium"
      color="neutral.c80"
    >
      {asset.balance}
    </Text>
  </BalanceContainer>
);

const formatProviderResult = (
  providerCurrency: CryptoOrTokenCurrency,
  totalBalance: BigNumber,
  totalFiatValue: BigNumber,
  counterValueCurrency: Currency,
  locale: string,
  discreet: boolean,
): ProviderBalanceAsset => {
  const mainCurrencyUnit = providerCurrency.units?.[0];
  const balanceDisplay = mainCurrencyUnit
    ? formatCurrencyUnit(mainCurrencyUnit, totalBalance, { showCode: true, discreet })
    : `${totalBalance.toFixed()} ${providerCurrency.ticker ?? providerCurrency.symbol}`;

  const formattedFiatValue = counterValueFormatter({
    currency: counterValueCurrency.ticker,
    value: totalFiatValue.toNumber(),
    locale,
    allowZeroValue: true,
  });

  const sortValue = discreet ? 0 : totalFiatValue.toNumber();

  return {
    id: providerCurrency.id,
    name: providerCurrency.name,
    ticker: providerCurrency.ticker ?? providerCurrency.symbol ?? providerCurrency.name,
    balance: balanceDisplay,
    fiatValue: formattedFiatValue,
    sortValue,
  };
};

export const useRightBalanceModule = (
  assets: CryptoOrTokenCurrency[],
  currenciesByProvider: CurrenciesByProviderId[],
) => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const groupedAccountsByAsset = useMemo(
    () => groupAccountsByAsset(flattenedAccounts, state, counterValueCurrency, discreet),
    [flattenedAccounts, state, counterValueCurrency, discreet],
  );

  const providerCurrenciesMap = useMemo(() => {
    if (!currenciesByProvider?.length) return null;

    const map = new Map<
      string,
      { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
    >();

    currenciesByProvider.forEach(({ providerId, currenciesByNetwork = [] }) => {
      if (currenciesByNetwork.length > 0) {
        const mainCurrency =
          currenciesByNetwork.find(c => c.id === providerId) ?? currenciesByNetwork[0];
        map.set(providerId, { mainCurrency, currencies: currenciesByNetwork });
      }
    });

    return map;
  }, [currenciesByProvider]);

  const result = useMemo(() => {
    if (!providerCurrenciesMap) {
      return getBalanceAndFiatValueByAssets(
        flattenedAccounts,
        assets,
        state,
        counterValueCurrency,
        discreet,
        locale,
      ).map(asset => ({
        ...asset,
        rightElement: createBalanceItem(asset),
      }));
    }

    const assetsToDisplaySet = new Set(assets.map(asset => asset.id));
    const providerResultsMap: ProviderBalanceResultsMap = new Map();

    for (const [_providerId, { currencies, mainCurrency }] of providerCurrenciesMap) {
      if (!assetsToDisplaySet.has(mainCurrency.id)) continue;

      const providerCurrency = getProviderCurrency(mainCurrency, currencies);
      if (!providerCurrency) continue;
      const { totalBalance, totalFiatValue, hasAccounts } = calculateProviderTotals(
        currencies,
        groupedAccountsByAsset,
      );

      if (!hasAccounts) continue;

      const result = formatProviderResult(
        providerCurrency,
        totalBalance,
        totalFiatValue,
        counterValueCurrency,
        locale,
        discreet,
      );

      providerResultsMap.set(mainCurrency.id, result);
    }

    return orderBy(
      assets.map(asset => {
        const providerResult = providerResultsMap.get(asset.id);
        if (providerResult) {
          return {
            ...asset,
            rightElement: createBalanceItem(providerResult),
            sortValue: providerResult.sortValue,
          };
        }
        return {
          ...asset,
          rightElement: createBalanceItem({}),
          sortValue: -1,
        };
      }),
      ["sortValue"],
      ["desc"],
    ).map(({ sortValue, ...asset }) => asset);
  }, [
    providerCurrenciesMap,
    assets,
    groupedAccountsByAsset,
    flattenedAccounts,
    state,
    counterValueCurrency,
    discreet,
    locale,
  ]);

  return result;
};
