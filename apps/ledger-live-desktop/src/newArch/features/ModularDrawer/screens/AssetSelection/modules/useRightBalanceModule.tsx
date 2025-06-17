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
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";

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

export const useRightBalanceModule = (assets: CryptoOrTokenCurrency[]) => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const assetsToDisplayWithDrawerConfig = getBalanceAndFiatValueByAssets(
    flattenedAccounts,
    assets,
    state,
    counterValueCurrency,
    discreet,
    locale,
  );

  return assetsToDisplayWithDrawerConfig
    .map(asset => ({
      ...asset,
      rightElement: createBalanceItem(asset),
    }))
    .sort((a, b) => {
      const parseFiatValue = (value?: string) => {
        if (value && discreet) return Number.MAX_SAFE_INTEGER;
        return value ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : -1;
      };

      return parseFiatValue(b.fiatValue) - parseFiatValue(a.fiatValue);
    });
};
