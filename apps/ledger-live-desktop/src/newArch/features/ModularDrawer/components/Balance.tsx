import React from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui/index";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import { BalanceUI } from "@ledgerhq/live-common/modularDrawer/utils/type";

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const balanceItem = (balanceUI: BalanceUI) => {
  const { currency, balance } = balanceUI;
  return (
    <BalanceContainer>
      <Text
        fontSize="14px"
        variant="largeLineHeight"
        fontWeight="semiBold"
        color="var(--colors-content-default-default)"
      >
        <CounterValue
          currency={currency}
          value={balance}
          placeholder="-"
          color="var(--colors-content-default-default)"
        />
      </Text>
      <Text
        fontSize="12px"
        lineHeight="16px"
        variant="bodyLineHeight"
        fontWeight="medium"
        color="var(--colors-content-subdued-default-default)"
      >
        <FormattedVal
          unit={currency.units[0]}
          val={balance}
          showCode
          color="var(--colors-content-subdued-default-default)"
        />
      </Text>
    </BalanceContainer>
  );
};
