import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { SelectCurrencyProps } from "./types";

export function SelectCurrency({ navigation }: SelectCurrencyProps) {
  const onSelect = useCallback(
    (currency: CryptoCurrency | TokenCurrency) => {
      navigation.navigate("Swap", { currency });
    },
    [navigation],
  );

  return (
    <Flex>
      <TouchableOpacity onPress={onSelect}>
        <Text>Select Currency</Text>
      </TouchableOpacity>
    </Flex>
  );
}
