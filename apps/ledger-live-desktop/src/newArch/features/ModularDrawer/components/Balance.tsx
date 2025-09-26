import React from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import CounterValue from "~/renderer/components/CounterValue";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const balanceItem = ({
  currency,
  balance,
}: {
  currency?: CryptoOrTokenCurrency;
  balance?: BigNumber;
}) => {
  return (
    <BalanceContainer>
      <Text
        fontSize="14px"
        variant="largeLineHeight"
        fontWeight="semiBold"
        color="var(--colors-content-default-default)"
      >
        {currency && balance ? (
          <CounterValue
            currency={currency}
            value={balance}
            placeholder="-"
            color="var(--colors-content-default-default)"
          />
        ) : (
          "-"
        )}
      </Text>
      <Text
        fontSize="12px"
        lineHeight="16px"
        variant="bodyLineHeight"
        fontWeight="medium"
        color="var(--colors-content-subdued-default-default)"
      >
        {currency && balance ? (
          <CurrencyUnitValue unit={currency.units[0]} value={balance} showCode />
        ) : (
          "-"
        )}
      </Text>
    </BalanceContainer>
  );
};
