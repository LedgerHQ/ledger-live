import React from "react";
import styled from "styled-components";
import { Icons } from "../../../assets";
import { Flex, Icon, Text } from "../../../components";
import { withTokens } from "../../libs";
import { Address } from "../Address/Address";
import type { CheckboxProps } from "../Checkbox/Checkbox";
import { Checkbox } from "../Checkbox/Checkbox";
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

export type RightElementArrow = {
  type: "arrow";
};

export type RightElementCheckbox = {
  type: "checkbox";
  checkbox: CheckboxProps;
};

export type RightElementEdit = {
  type: "edit";
  onClick: () => void;
};

export type RightElement = RightElementArrow | RightElementCheckbox | RightElementEdit;

export type AccountItemProps = {
  onClick?: () => void;
  account: Account;
  rightElement?: RightElement;
  showIcon?: boolean;
  backgroundColor?: string;
};

const ICON_BUTTONS_SIZE = "32px";

// TODO a proper IconButton component that handles hover and pressed states.
const IconButton = styled.button`
  ${withTokens("colors-content-default-default")}

  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: ${ICON_BUTTONS_SIZE};
  width: ${ICON_BUTTONS_SIZE};
`;

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
    <Wrapper backgroundColor={backgroundColor} isClickable={Boolean(onClick)} onClick={onClick}>
      <ContentContainer>
        <AccountInfoContainer>
          <NameRow>
            <NameDiv>
              <Text
                data-testid={`account-row-${name}`}
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
            isShortened
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
          <Flex data-testid="right-element-checkbox" aria-label="Checkbox account item">
            <Checkbox {...rightElement.checkbox} size={20} />
          </Flex>
        )}
        {rightElement && rightElement.type === "arrow" && (
          <Flex data-testid="right-element-arrow-icon" aria-label="Arrow account item">
            <Icon name="ChevronRight" size={24} />
          </Flex>
        )}
        {rightElement && rightElement.type === "edit" && (
          <IconButton
            aria-label="Edit account item"
            data-testid="right-element-edit-icon"
            onClick={e => {
              e.stopPropagation();
              if (rightElement?.type === "edit") {
                rightElement.onClick();
              }
            }}
          >
            <Icons.PenEdit size="S" color="var(--colors-content-default-default)" />
          </IconButton>
        )}
      </ContentContainer>
    </Wrapper>
  );
};
