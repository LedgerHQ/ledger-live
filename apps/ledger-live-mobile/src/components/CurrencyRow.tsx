import React, { useCallback } from "react";
import { RectButton } from "react-native-gesture-handler";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";

import styled from "styled-components/native";
import { Flex, Tag } from "@ledgerhq/native-ui";
import LText from "./LText";
import CircleCurrencyIcon from "./CircleCurrencyIcon";

const StyledRectButton = styled(RectButton)`
  flex-direction: row;
  align-items: center;
  padding: 16px;
`;

type Props = {
  currency: CryptoCurrency | TokenCurrency;
  onPress: (_: CryptoCurrency | TokenCurrency) => void;
  isOK?: boolean;
  style?: React.ComponentProps<typeof RectButton>["style"];
  iconSize?: number;
};

const CurrencyRow = ({
  currency,
  style,
  isOK = true,
  iconSize = 32,
  onPress,
}: Props) => {
  const onPressAction = useCallback(() => {
    onPress(currency);
  }, [onPress, currency]);

  const { colors } = useTheme();

  return (
    <StyledRectButton style={[style]} onPress={onPressAction}>
      <CircleCurrencyIcon
        size={iconSize}
        currency={currency}
        color={!isOK ? colors.lightFog : undefined}
      />
      <Flex
        flexDirection="row"
        flex={1}
        alignItems="center"
        justifyContent="flex-start"
      >
        <LText
          semiBold
          variant="body"
          numberOfLines={1}
          ml={4}
          color={!isOK ? "neutral.c70" : "neutral.c100"}
        >
          {currency.name}
        </LText>
        <LText
          semiBold
          variant="body"
          numberOfLines={1}
          ml={3}
          color={!isOK ? "neutral.c50" : "neutral.c70"}
        >
          {currency.ticker}
        </LText>
      </Flex>
      {currency.type === "TokenCurrency" && currency.parentCurrency ? (
        <Tag>{currency.parentCurrency.name}</Tag>
      ) : null}
    </StyledRectButton>
  );
};

export default CurrencyRow;
