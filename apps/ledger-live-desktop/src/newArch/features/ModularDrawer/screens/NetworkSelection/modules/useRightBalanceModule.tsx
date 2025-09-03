import React, { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { useSelector } from "react-redux";
import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getBalanceAndFiatValueByAssets } from "@ledgerhq/live-common/modularDrawer/utils/getBalanceAndFiatValueByAssets";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  localeSelector,
} from "~/renderer/reducers/settings";

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

export const useRightBalanceModule = ({
  assets: networks,
  selectedAssetId,
  currenciesByProvider,
}: {
  assets: CryptoOrTokenCurrency[];
  selectedAssetId: string;
  currenciesByProvider: CurrenciesByProviderId[];
}) => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const result = useMemo(() => {
    const providerOfSelectedAsset = currenciesByProvider.find(provider =>
      provider.currenciesByNetwork.some(currency => currency.id === selectedAssetId),
    );

    if (!providerOfSelectedAsset) {
      return networks.map(network => ({
        ...network,
        rightElement: createBalanceItem({}),
      }));
    }

    const networkAssetPairs = networks.map(network => ({
      network,
      asset: providerOfSelectedAsset.currenciesByNetwork.find(currency => {
        return currency.type === "TokenCurrency"
          ? currency.parentCurrency.id === network.id
          : currency.id === network.id;
      }),
    }));

    const validAssetPairs = networkAssetPairs.filter(pair => pair.asset);
    const validAssets = validAssetPairs.map(pair => pair.asset!);

    const allBalanceData =
      validAssets.length > 0
        ? getBalanceAndFiatValueByAssets(
            flattenedAccounts,
            validAssets,
            state,
            counterValueCurrency,
            discreet,
            locale,
          )
        : [];

    const balanceMap = new Map(allBalanceData.map(balance => [balance.id, balance]));

    const networksWithBalanceData = networkAssetPairs.map(({ network, asset }) => {
      const balanceData = asset ? balanceMap.get(asset.id) || {} : {};
      return {
        ...network,
        rightElement: createBalanceItem(balanceData),
        balanceData,
      };
    });

    const sortedNetworks = [...networksWithBalanceData].sort((a, b) => {
      const parseFiatValue = (value?: string) => {
        if (!value || discreet) return -1;
        return parseFloat(value.replace(/[^0-9.-]+/g, "")) || -1;
      };

      const getFiatValue = (data: (typeof networksWithBalanceData)[0]) => {
        const fiatValue =
          data.balanceData && "fiatValue" in data.balanceData
            ? String(data.balanceData.fiatValue)
            : undefined;

        return parseFiatValue(fiatValue);
      };

      const aHasBalance =
        a.balanceData && ("balance" in a.balanceData || "fiatValue" in a.balanceData);
      const bHasBalance =
        b.balanceData && ("balance" in b.balanceData || "fiatValue" in b.balanceData);

      if (aHasBalance && !bHasBalance) return -1;
      if (!aHasBalance && bHasBalance) return 1;

      return getFiatValue(b) - getFiatValue(a);
    });

    return sortedNetworks.map(({ balanceData, ...network }) => network);
  }, [
    networks,
    selectedAssetId,
    currenciesByProvider,
    flattenedAccounts,
    state,
    counterValueCurrency,
    discreet,
    locale,
  ]);

  return result;
};
