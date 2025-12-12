import React from "react";
import { Pressable, View } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { Tokens, useTokens } from "../../libs";
import Text from "../../../components/Text";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";

export type Network = {
  name: string;
  id: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type NetworkItemProps = Network & {
  onClick: () => void;
};

const Wrapper = styled(Pressable)<{ tokens: Tokens }>`
  flex-direction: row;
  padding-vertical: ${({ tokens }) => tokens["spacing-xxs"]}px;
  border-radius: ${({ tokens }) => tokens["radius-s"]}px;
  align-items: center;
  width: 100%;
`;

const InfoWrapper = styled(View)<{ tokens: Tokens }>`
  flex-direction: column;
  justify-content: center;
  margin-left: 16px;
  flex: 1;
`;

const LeftElementWrapper = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 4;
`;

const TOKEN_KEYS = [
  "spacing-xxs",
  "margin-s",
  "radius-s",
  "colors-content-default-default",
  "colors-content-subdued-default-default",
  "colors-surface-transparent-hover",
  "colors-surface-transparent-pressed",
] as const;

export const NetworkItem = ({
  name,
  onClick,
  id,
  ticker,
  leftElement,
  rightElement,
}: NetworkItemProps) => {
  const theme = useTheme();
  const colorType = theme.colors.type === "dark" ? "dark" : "light";

  const tokens = useTokens(colorType, [...TOKEN_KEYS]);

  return (
    <Wrapper
      tokens={tokens}
      onPress={onClick}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
      testID={`network-item-${name}`}
    >
      <CryptoIcon size={48} ledgerId={id} ticker={ticker} />
      <InfoWrapper tokens={tokens}>
        <Text
          variant="largeLineHeight"
          fontWeight="semiBold"
          color={String(tokens["colors-content-default-default"])}
        >
          {name}
        </Text>
        <LeftElementWrapper>{leftElement}</LeftElementWrapper>
      </InfoWrapper>
      {rightElement}
    </Wrapper>
  );
};
