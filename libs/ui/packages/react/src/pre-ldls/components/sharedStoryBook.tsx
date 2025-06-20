import React from "react";
import styled from "styled-components";
import { Text } from "../../components";
import { Tag } from "./Tag/Tag";

export const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const leftElement = <Tag>{"1.34% APY"}</Tag>;

export const createRightElement = (discreetMode: boolean) => (
  <BalanceContainer>
    <Text
      fontSize="14px"
      variant="largeLineHeight"
      fontWeight="semiBold"
      color="var(--colors-content-default-default)"
    >
      {discreetMode ? "$***" : "$5,969.83"}
    </Text>
    <Text
      fontSize="12px"
      lineHeight="16px"
      variant="bodyLineHeight"
      fontWeight="medium"
      color="var(--colors-content-subdued-default-default)"
    >
      {discreetMode ? "*** BTC" : "0.118 BTC"}
    </Text>
  </BalanceContainer>
);
