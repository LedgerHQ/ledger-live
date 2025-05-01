import React from "react";
import styled from "styled-components";
import { withTokens } from "../../libs";
import { Text } from "../../../components";
import { Tag } from "../Tag/Tag"; // TODO add to index
import { Address } from "../Address/Address";

export type AssetType = {
  name: string;
  ticker: string;
};

type AccountItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
  fiatValue: string;
  balance: string;
  address: string;
  protocol?: string;
  showIcon?: boolean;
};

const Wrapper = styled.div`
  ${withTokens(
    "spacing-xxs",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
    "colors-content-subdued-default-default",
  )}

  display: flex;
  padding: var(--spacing-xxs);
  cursor: pointer;
  justify-content: space-between;
  align-items: center;

  :hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  :active {
    background-color: var(--colors-surface-transparent-pressed);
  }
`;

export const AccountItem = ({
  name,
  ticker,
  onClick,
  balance,
  fiatValue,
  protocol,
  address,
  showIcon = true,
}: AccountItemProps) => {
  return (
    <Wrapper onClick={() => onClick({ name, ticker })}>
      {/* TODO sort out this onclick */}
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
              marginBottom: 10,
            }}
          >
            <Text
              variant="largeLineHeight"
              fontWeight="semiBold"
              color="var(--colors-content-default-default)"
              style={{ marginRight: 6, fontSize: 14, lineHeight: "14px" }}
            >
              {name}
            </Text>
            {protocol && <Tag>{protocol}</Tag>}
          </div>
          <Address address={address} icon="BTC" showIcon={showIcon} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
        <Text style={{ fontSize: 14 }}>{fiatValue}</Text>
        <Text style={{ fontSize: 12 }} color="var(--colors-content-subdued-default-default)">
          {balance}
        </Text>
      </div>
    </Wrapper>
  );
};
