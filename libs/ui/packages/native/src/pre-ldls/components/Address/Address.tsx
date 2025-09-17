import React from "react";
import { View } from "react-native";
import styled, { useTheme } from "styled-components/native";
import Text from "../../../components/Text";
import { CryptoIcon } from "../CryptoIcon/CryptoIcon";
import { useTokens } from "../../libs";

const Wrapper = styled(View)`
  flex-direction: row;
  align-items: center;
`;

export const Address = ({
  address,
  showIcon,
  cryptoId,
  ticker,
  parentId,
  backgroundColor,
}: {
  address: string;
  showIcon: boolean;
  cryptoId?: string;
  ticker?: string;
  parentId?: string;
  backgroundColor: string;
}) => {
  const { theme } = useTheme();
  const colorType = theme;
  const tokens = useTokens(colorType, ["spacing-xxxs", "colors-content-subdued-default-default"]);

  return (
    <Wrapper>
      <Text
        fontSize="14px"
        color={String(tokens["colors-content-subdued-default-default"])}
        marginRight={showIcon ? Number(tokens["spacing-xxxs"]) : 0}
      >
        {address}
      </Text>
      {showIcon && (
        <CryptoIcon
          ledgerId={cryptoId}
          network={parentId}
          ticker={ticker}
          size={20}
          theme={theme}
          backgroundColor={backgroundColor}
        />
      )}
    </Wrapper>
  );
};
