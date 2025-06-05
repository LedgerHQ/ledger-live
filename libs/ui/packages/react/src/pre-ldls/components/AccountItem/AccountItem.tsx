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
  parentId?: string;
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
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 200px;
  overflow: hidden;

  :hover {
    background-color: var(--colors-surface-transparent-hover);
  }

  :active {
    background-color: var(--colors-surface-transparent-pressed);
  }
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
  flex: 1;
  width: 100%;
  overflow: hidden;
`;

const AccountInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const NameRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: var(--spacing-xxxs);
  min-width: 0;
  width: 100%;
`;

const NameDiv = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
  max-width: fit-content;
`;

const TagWrapper = styled.div`
  flex-shrink: 0;
  margin-left: var(--spacing-xxs);
  display: flex;
  flex: 1;
  max-width: fit-content;
  align-items: center;
`;

const BalanceContainer = styled.div`
  display: flex;
  flex-direction: column;
  text-align: right;
  flex-shrink: 0;
  margin-left: var(--spacing-xs);
`;

export const AccountItem = ({ onClick, account, showIcon = true }: AccountItemProps) => {
  const { name, balance, fiatValue, protocol, address, ticker, cryptoId, parentId } = account;

  return (
    <Wrapper onClick={onClick}>
      <ContentContainer>
        <AccountInfoContainer>
          <NameRow>
            <NameDiv>
              <Text
                variant="largeLineHeight"
                fontWeight="semiBold"
                color="var(--colors-content-default-default)"
                fontSize="14px"
                lineHeight="20px"
                title={name}
                style={{
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {name}
              </Text>
            </NameDiv>
            {protocol && (
              <TagWrapper>
                <Tag textTransform="uppercase">{protocol}</Tag>
              </TagWrapper>
            )}
          </NameRow>
          <Address
            address={address}
            cryptoId={cryptoId}
            ticker={ticker}
            parentId={parentId}
            showIcon={showIcon}
          />
        </AccountInfoContainer>
        <BalanceContainer>
          <Text fontSize="14px">{fiatValue}</Text>
          <Text fontSize="12px" color="var(--colors-content-subdued-default-default)">
            {balance}
          </Text>
        </BalanceContainer>
      </ContentContainer>
    </Wrapper>
  );
};
