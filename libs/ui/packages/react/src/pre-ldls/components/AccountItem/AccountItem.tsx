import React from "react";
import styled from "styled-components";
import type { CheckboxProps } from "../../../components/form/Checkbox/Checkbox";
import { Checkbox, Icon, Text, Flex } from "../../../components";
import { withTokens } from "../../libs";
import { Address } from "../Address/Address";
import { Tag } from "../Tag/Tag";

export type Account = {
  address: string;
  balance?: string;
  cryptoId?: string;
  fiatValue?: string;
  id: string;
  name: string;
  parentId?: string;
  protocol?: string;
  ticker?: string;
};

export type RightElementCheckbox = {
  type: "checkbox";
  checkbox: CheckboxProps;
};

export type RightElementArrow = {
  type: "arrow";
};

export type RightElement = RightElementCheckbox | RightElementArrow;

export type AccountItemProps = {
  onClick?: () => void;
  account: Account;
  rightElement?: RightElement;
  showIcon?: boolean;
  backgroundColor?: string;
};

const Wrapper = styled.div<{ backgroundColor?: string; isClickable: boolean }>`
  ${withTokens(
    "spacing-xxxs",
    "spacing-xxs",
    "spacing-xs",
    "margin-s",
    "radius-s",
    "radius-m",
    "colors-content-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
    "colors-content-subdued-default-default",
    "colors-surface-transparent-subdued-default",
  )}

  display: flex;
  cursor: ${p => (p.isClickable ? "pointer" : "default")};
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  min-width: 200px;
  overflow: hidden;

  background-color: ${p => (p.backgroundColor ? p.backgroundColor : "transparent")};

  ${p =>
    p.isClickable
      ? `
    border-radius: var(--radius-m);
    padding: var(--margin-s);
    :hover {
      background-color: var(--colors-surface-transparent-hover);
    }

    :active {
      background-color: var(--colors-surface-transparent-pressed);
    }
  `
      : ""}
`;

const ContentContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: var(--spacing-xs);
  justify-content: space-between;
  min-width: 0;
  overflow: hidden;
  width: 100%;
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
  flex-shrink: 0;
  text-align: right;
`;

export const AccountItem = ({
  onClick,
  account,
  rightElement,
  showIcon = true,
  backgroundColor,
}: AccountItemProps) => {
  const { name, balance, fiatValue, protocol, address, ticker, cryptoId, parentId } = account;

  return (
    <Wrapper onClick={onClick} backgroundColor={backgroundColor} isClickable={!!onClick}>
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
          {fiatValue && <Text fontSize="14px">{fiatValue}</Text>}
          {balance && (
            <Text fontSize="12px" color="var(--colors-content-subdued-default-default)">
              {balance}
            </Text>
          )}
        </BalanceContainer>
        {rightElement && rightElement.type === "checkbox" && (
          <Flex data-testid="right-element-checkbox">
            <Checkbox {...rightElement.checkbox} size={20} />
          </Flex>
        )}
        {rightElement && rightElement.type === "arrow" && (
          <Flex data-testid="right-element-arrow-icon">
            <Icon name="ChevronRight" size={24} />
          </Flex>
        )}
      </ContentContainer>
    </Wrapper>
  );
};
