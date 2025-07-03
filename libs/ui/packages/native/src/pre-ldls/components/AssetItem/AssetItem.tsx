import React from "react";
import { TouchableOpacity, View } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../../components/Text";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";
import { useTokens } from "../../libs";

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type AssetItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

const Wrapper = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  width: 100%;
`;

const InfoWrapper = styled(View)`
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  flex: 1;
  gap: 4px;
`;

const LeftElementWrapper = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

export const AssetItem = ({
  name,
  ticker,
  id,
  onClick,
  leftElement,
  rightElement,
}: AssetItemProps) => {
  const theme = useTheme();
  const tokens = useTokens(theme.colors.type as "dark" | "light", [
    "spacing-xxs",
    "margin-s",
    "radius-s",
    "colors-content-default-default",
    "colors-content-subdued-default-default",
    "colors-surface-transparent-default",
  ]);

  return (
    <Wrapper
      onPress={() => onClick({ name, ticker, id })}
      activeOpacity={0.7}
      style={{
        padding: tokens["spacing-xxs"] as number,
        borderRadius: tokens["radius-s"] as number,
        backgroundColor: tokens["colors-surface-transparent-default"] as string,
      }}
    >
      <CryptoIcon size="48px" ledgerId={id} ticker={ticker} />
      <InfoWrapper
        style={{
          marginLeft: tokens["margin-s"] as number,
        }}
      >
        <Text
          fontSize="14px"
          variant="largeLineHeight"
          fontWeight="semiBold"
          color={tokens["colors-content-default-default"] as string}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        <LeftElementWrapper>
          <Text
            fontSize="12px"
            lineHeight="16px"
            variant="bodyLineHeight"
            fontWeight="medium"
            color={tokens["colors-content-subdued-default-default"] as string}
          >
            {ticker}
          </Text>
          {leftElement}
        </LeftElementWrapper>
      </InfoWrapper>
      {rightElement}
    </Wrapper>
  );
};
