import React from "react";
import { Pressable, View } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { ChevronRightMedium, PenMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import Text from "../../../components/Text";
import { Address } from "../Address/Address";
import { Tag } from "../Tag/Tag";
import Checkbox from "../../../components/Form/Checkbox";
import { useTokens } from "../../libs";

export type AccountUI = {
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
  checkbox: {
    checked: boolean;
    onChange?: () => void;
    disabled?: boolean;
  };
};

export type RightElementEdit = {
  type: "edit";
  onClick: () => void;
};

export type RightElement = RightElementArrow | RightElementCheckbox | RightElementEdit;

export type AccountItemProps = {
  onClick?: () => void;
  account: AccountUI;
  rightElement?: RightElement;
  showIcon?: boolean;
  backgroundColor?: string;
  cryptoIconBackgroundColor: string;
};

const ICON_BUTTONS_SIZE = 32;

const IconButton = styled(Pressable)`
  align-items: center;
  justify-content: center;
  height: ${ICON_BUTTONS_SIZE}px;
  width: ${ICON_BUTTONS_SIZE}px;
`;

const Wrapper = styled(Pressable)<{ backgroundColor?: string; isClickable: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  overflow: hidden;
  ${(props) => props.backgroundColor && `background-color: ${props.backgroundColor};`}
`;

const ContentContainer = styled(View)`
  align-items: center;
  flex-direction: row;
  flex: 1;
  justify-content: space-between;
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const AccountInfoContainer = styled(View)`
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const NameRow = styled(View)`
  flex-direction: row;
  align-items: center;
  min-width: 0;
  width: 100%;
`;

const NameWrapper = styled(View)`
  min-width: 0;
  flex-shrink: 1;
`;

const TagWrapper = styled(View)`
  flex-shrink: 0;
  align-items: flex-start;
`;

const BalanceContainer = styled(View)`
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-end;
`;

const RightElementContainer = styled(View)`
  align-items: center;
  justify-content: center;
`;

type RightElementRendererProps = {
  rightElement: RightElement;
  tokens: Record<string, string | number>;
  onEditPress: () => void;
};

const RightElementRenderer = ({ rightElement, tokens, onEditPress }: RightElementRendererProps) => {
  return (
    <RightElementContainer style={{ marginLeft: Number(tokens["spacing-xs"]) }}>
      {rightElement.type === "checkbox" && (
        <View testID="right-element-checkbox">
          <Checkbox
            checked={rightElement.checkbox.checked}
            onChange={rightElement.checkbox.onChange}
            disabled={rightElement.checkbox.disabled}
          />
        </View>
      )}
      {rightElement.type === "arrow" && (
        <View testID="right-element-arrow-icon">
          <ChevronRightMedium size={24} color={String(tokens["colors-content-default-default"])} />
        </View>
      )}
      {rightElement.type === "edit" && (
        <IconButton onPress={onEditPress} testID="right-element-edit-icon">
          <PenMedium size={16} color={String(tokens["colors-content-default-default"])} />
        </IconButton>
      )}
    </RightElementContainer>
  );
};

export const AccountItem = ({
  onClick,
  account,
  rightElement,
  showIcon = true,
  backgroundColor,
  cryptoIconBackgroundColor,
}: AccountItemProps) => {
  const theme = useTheme();
  const colorType = theme.colors.type === "dark" ? "dark" : "light";
  const tokens = useTokens(colorType, [
    "spacing-xxxs",
    "spacing-xs",
    "margin-s",
    "radius-s",
    "colors-content-default-default",
    "colors-content-subdued-default-default",
    "colors-surface-transparent-hover",
    "colors-surface-transparent-pressed",
  ]);

  const { name, balance, fiatValue, protocol, address, ticker, cryptoId, parentId } = account;

  const handlePress = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleEditPress = () => {
    if (rightElement?.type === "edit") {
      rightElement.onClick();
    }
  };

  return (
    <Wrapper
      backgroundColor={backgroundColor}
      isClickable={Boolean(onClick)}
      onPress={handlePress}
      style={({ pressed }) => ({
        paddingTop: onClick ? Number(tokens["margin-s"]) : 0,
        borderRadius: onClick ? Number(tokens["radius-s"]) : 0,
        opacity: pressed && onClick ? 0.7 : 1,
      })}
      testID="account-item"
    >
      <ContentContainer>
        <AccountInfoContainer>
          <NameRow style={{ marginBottom: Number(tokens["spacing-xxxs"]) }}>
            <NameWrapper>
              <Text
                variant="largeLineHeight"
                fontWeight="semiBold"
                color={String(tokens["colors-content-default-default"])}
                fontSize="18px"
                numberOfLines={1}
                ellipsizeMode="tail"
                testID={`account-item-name-${name}`}
              >
                {name}
              </Text>
            </NameWrapper>
            {protocol && (
              <TagWrapper style={{ marginLeft: Number(tokens["spacing-xs"]) }}>
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
            backgroundColor={cryptoIconBackgroundColor}
          />
        </AccountInfoContainer>

        <BalanceContainer style={{ gap: Number(tokens["spacing-xxxs"]) }}>
          {fiatValue && (
            <Text fontSize="18px" color={String(tokens["colors-content-default-default"])}>
              {fiatValue}
            </Text>
          )}
          {balance && (
            <Text fontSize="14px" color={String(tokens["colors-content-subdued-default-default"])}>
              {balance}
            </Text>
          )}
        </BalanceContainer>

        {rightElement && (
          <RightElementRenderer
            rightElement={rightElement}
            tokens={tokens}
            onEditPress={handleEditPress}
          />
        )}
      </ContentContainer>
    </Wrapper>
  );
};
