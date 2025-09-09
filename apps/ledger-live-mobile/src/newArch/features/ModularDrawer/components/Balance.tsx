import React from "react";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";

const BalanceContainer = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const balanceItem = (asset: { fiatValue?: string; balance?: string }) => {
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
