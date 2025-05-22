import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";
import { Tag } from "../Tag/Tag";
import { Address } from "../Address/Address";

export type Account = {
  name: string;
  id: string;
  balance: string;
  fiatValue: string;
  address: string;
  protocol?: string;
  cryptoId?: string;
  ticker?: string;
};

type AccountItemProps = {
  onClick: () => void;
  showIcon?: boolean;
  account: Account;
};

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xxxs",
    "spacing-xxs",
    "spacing-xs",
    "radius-s",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
    "colors-content-subdued-default-default",
  )}

  display: flex;
  padding: var(--spacing-xs) var(--spacing-xxs);
  cursor: pointer;
  border-radius: var(--radius-s, 8px);
  justify-content: space-between;
  align-items: center;

  :hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  :active {
    background-color: var(--colors-surface-transparent-pressed);
  }
`;

export const AccountItem = ({ onClick, account, showIcon = true }: AccountItemProps) => {
  const { name, balance, fiatValue, protocol, address, ticker, cryptoId } = account;

  return (
    <Wrapper onClick={onClick}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "var(--spacing-xxxs)",
            }}
          >
            <Text
              variant="largeLineHeight"
              fontWeight="semiBold"
              color="var(--colors-content-default-default)"
              marginRight="var(--spacing-xxs)"
              fontSize="14px"
              lineHeight="20px"
            >
              {name}
            </Text>
            {protocol && <Tag textTransform="capitalize">{protocol}</Tag>}
          </div>
          <Address address={address} cryptoId={cryptoId} ticker={ticker} showIcon={showIcon} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
        <Text fontSize="14px">{fiatValue}</Text>
        <Text fontSize="12px" color="var(--colors-content-subdued-default-default)">
          {balance}
        </Text>
      </div>
    </Wrapper>
  );
};
