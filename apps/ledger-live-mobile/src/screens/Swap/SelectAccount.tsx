import React, { useCallback } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { SelectAccountProps } from "./types";

export function SelectAccount({ navigation }: SelectAccountProps) {
  const onSelect = useCallback(
    (account: Account | TokenAccount) => {
      navigation.navigate("Swap", { account });
    },
    [navigation],
  );

  return (
    <Flex>
      <TouchableOpacity onPress={onSelect}>
        <Text>Select Account</Text>
      </TouchableOpacity>
    </Flex>
  );
}
