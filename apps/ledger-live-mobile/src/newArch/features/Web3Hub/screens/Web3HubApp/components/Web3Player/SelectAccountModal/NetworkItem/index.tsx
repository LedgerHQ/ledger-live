import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";

type Props = {
  currency: CryptoCurrency;
  onPress: (currency: CryptoCurrency) => void;
};

export default function NetworkItem({ currency, onPress }: Props) {
  const handlePress = useCallback(() => {
    onPress(currency);
  }, [currency, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Flex pt={6} px={6} flexDirection={"row"} alignItems={"center"}>
        <CircleCurrencyIcon currency={currency} size={50} />

        <Text flex={1} pl={4} variant="large" fontWeight="semiBold" numberOfLines={1}>
          {currency.name}
        </Text>
      </Flex>
    </TouchableOpacity>
  );
}
