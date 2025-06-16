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
import { groupAccountsByAsset } from "../../../utils/groupAccountsByAsset";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import { counterValueFormatter } from "LLD/utils/counterValueFormatter";

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

    const results: Array<{
      id: string;
      name: string;
      ticker: string;
      balance: string;
      fiatValue: string;
      sortValue: number;
    }> = [];

    for (const [_providerId, { mainCurrency, currencies }] of providerCurrenciesMap) {
      const hasRelevantCurrency = currencies.some(currency => assetsToDisplaySet.has(currency.id));
      if (!hasRelevantCurrency) continue;

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

      if (!hasAccounts) continue;

      const mainCurrencyUnit = mainCurrency.units?.[0];
      const balanceDisplay = mainCurrencyUnit
        ? formatCurrencyUnit(mainCurrencyUnit, totalBalance, { showCode: true, discreet })
        : `${totalBalance.toFixed()} ${mainCurrency.ticker ?? mainCurrency.symbol}`;

      const formattedFiatValue = counterValueFormatter({
        currency: counterValueCurrency.ticker,
        value: totalFiatValue.toNumber(),
        locale,
        allowZeroValue: true,
        discreetMode: discreet,
      });

      const sortValue = discreet ? 0 : totalFiatValue.toNumber();

      results.push({
        id: mainCurrency.id,
        name: mainCurrency.name,
        ticker: mainCurrency.ticker ?? mainCurrency.symbol ?? mainCurrency.name,
        balance: balanceDisplay,
        fiatValue: formattedFiatValue,
        sortValue,
      });
    }

    results.sort((a, b) => b.sortValue - a.sortValue);

    return results.map(({ sortValue, ...result }) => ({
      ...result,
      rightElement: createBalanceItem(result),
    }));
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
