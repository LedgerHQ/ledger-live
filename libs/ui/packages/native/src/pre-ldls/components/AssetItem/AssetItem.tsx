import React from "react";
import { Pressable, View } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../../components/Text";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";
import { useTokens } from "../../libs";

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  contractAddress?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type AssetItemProps = AssetType & {
  onClick: (asset: AssetType) => void;
};

const Wrapper = styled(Pressable)`
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
  margin-left: 16px;
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
  contractAddress,
  onClick,
  leftElement,
  rightElement,
}: AssetItemProps) => {
  const theme = useTheme();
  const colorType = theme.colors.type === "dark" ? "dark" : "light";
  const tokens = useTokens(colorType, [
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
      style={({ pressed }) => ({
        paddingVertical: Number(tokens["spacing-xxs"]),
        borderRadius: Number(tokens["radius-s"]),
        backgroundColor: String(tokens["colors-surface-transparent-default"]),
        opacity: pressed ? 0.7 : 1,
      })}
      testID={`asset-item-${contractAddress ?? id}`}
    >
      <CryptoIcon size={48} ledgerId={id} ticker={ticker} />
      <InfoWrapper>
        <Text
          fontSize="14px"
          variant="largeLineHeight"
          fontWeight="semiBold"
          color={String(tokens["colors-content-default-default"])}
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
            color={String(tokens["colors-content-subdued-default-default"])}
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
