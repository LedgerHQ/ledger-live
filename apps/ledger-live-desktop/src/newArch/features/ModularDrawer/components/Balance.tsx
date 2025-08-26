import React, { useMemo } from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { flattenAccounts } from "@ledgerhq/coin-framework/lib-es/account/helpers";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
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

export const createBalanceItem = (asset: { fiatValue?: string; balance?: string }) => (
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

export const useBalanceDeps = () => {
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = useMemo(() => flattenAccounts(allAccounts), [allAccounts]);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  return { flattenedAccounts, discreet, state, counterValueCurrency, locale };
};
