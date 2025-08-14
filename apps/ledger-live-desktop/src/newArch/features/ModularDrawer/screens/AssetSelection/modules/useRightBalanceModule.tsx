import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { getBalanceAndFiatValueByAssets } from "../../../utils/getBalanceAndFiatValueByAssets";
import { groupAccountsByAsset, GroupedAccount } from "../../../utils/groupAccountsByAsset";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { counterValueFormatter } from "LLD/utils/counterValueFormatter";
import { getTokenOrCryptoCurrencyById } from "@ledgerhq/live-common/deposit/helper";
import orderBy from "lodash/orderBy";
import { ProviderBalanceAsset, ProviderBalanceResultsMap } from "./types";

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const createBalanceItem = (asset: { fiatValue?: string; balance?: string }) => (
  <BalanceContainer>
    <Text
      fontSize="14px"
      variant="largeLineHeight"
      fontWeight="semiBold"
      color="var(--colors-content-default-default)"
    >
      {asset.fiatValue}
    </Text>
    <Text
      fontSize="12px"
      lineHeight="16px"
      variant="bodyLineHeight"
      fontWeight="medium"
      color="var(--colors-content-subdued-default-default)"
    >
      {asset.balance}
    </Text>
  </BalanceContainer>
);

const getProviderCurrency = (
  mainCurrency: CryptoOrTokenCurrency,
  currencies: CryptoOrTokenCurrency[],
) => {
  try {
    return getTokenOrCryptoCurrencyById(mainCurrency.id);
  } catch {
    return getTokenOrCryptoCurrencyById(currencies[0].id);
  }
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
    discreetMode: discreet,
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
