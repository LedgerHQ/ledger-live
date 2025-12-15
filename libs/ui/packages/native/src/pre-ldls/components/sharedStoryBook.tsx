import React from "react";
import styled from "styled-components/native";
import { Text } from "../../components";
import { Tag } from "./Tag/Tag";

export const BalanceContainer = styled.View`
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const leftElement = <Tag>{"1.34% APY"}</Tag>;

export const createRightElement = (discreetMode: boolean) => (
  <BalanceContainer>
    <Text fontSize="14px" variant="largeLineHeight" fontWeight="semiBold" color="neutral.c100">
      {discreetMode ? "$***" : "$5,969.83"}
    </Text>
    <Text
      fontSize="12px"
      lineHeight="16px"
      variant="bodyLineHeight"
      fontWeight="medium"
      color="neutral.c70"
    >
      {discreetMode ? "*** BTC" : "0.118 BTC"}
    </Text>
  </BalanceContainer>
);
