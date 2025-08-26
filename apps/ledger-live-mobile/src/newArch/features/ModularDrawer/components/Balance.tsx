import React from "react";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { flattenAccounts } from "@ledgerhq/coin-framework/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountsSelector } from "~/reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  localeSelector,
} from "~/reducers/settings";

const BalanceContainer = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const createBalanceItem = (asset: { fiatValue?: string; balance?: string }) => {
  return (
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
};

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  return { flattenedAccounts, discreet, state, counterValueCurrency, locale };
};
