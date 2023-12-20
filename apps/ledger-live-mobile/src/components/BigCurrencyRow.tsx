import React, { useCallback } from "react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Flex, Text } from "@ledgerhq/native-ui";
import CircleCurrencyIcon from "./CircleCurrencyIcon";
import { TouchableOpacity } from "react-native-gesture-handler";
import styled from "styled-components/native";

const RowContainer = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: center;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
`;

type Props = {
  currency: CryptoCurrency | TokenCurrency;
  iconSize?: number;
  onPress: (_: CryptoCurrency | TokenCurrency) => void;
  subTitle?: string;
};

const BigCurrencyRow = ({ currency, iconSize = 48, onPress, subTitle }: Props) => {
  const onPressAction = useCallback(() => {
    onPress(currency);
  }, [onPress, currency]);

  return (
    <RowContainer onPress={onPressAction} testID={`big-currency-row-${currency.id}`}>
      <CircleCurrencyIcon size={iconSize} sizeRatio={0.7} currency={currency} />
      <Flex flex={1} justifyContent="center" alignItems="flex-start" ml={6}>
        <Text
          variant="large"
          fontWeight="semiBold"
          numberOfLines={1}
          color="neutral.c100"
          testID={`big-currency-name-${currency.name}`}
        >
          {currency.name}
        </Text>
        {subTitle ? (
          <Text
            variant="body"
            fontWeight="semiBold"
            numberOfLines={1}
            color="neutral.c70"
            mt={2}
            testID={`big-currency-subtitle-${subTitle}`}
          >
            {subTitle}
          </Text>
        ) : null}
      </Flex>
    </RowContainer>
  );
};

export default BigCurrencyRow;
