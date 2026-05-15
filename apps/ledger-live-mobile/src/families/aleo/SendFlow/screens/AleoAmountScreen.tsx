import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import { AmountScreen as BaseAmountScreen } from "~/mvvm/features/Send/screens/Amount";
import { useSendFlowData } from "~/mvvm/features/Send/context/SendFlowContext";
import type { AleoTransaction } from "@ledgerhq/coin-aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/coin-aleo/types";

export function AleoAmountScreen() {
  const { state } = useSendFlowData();

  const balanceType = useMemo(() => {
    const transaction = state.transaction as AleoTransaction | undefined;
    if (!transaction) return "public";

    return transaction.mode === TRANSACTION_TYPE.TRANSFER_PRIVATE ? "private" : "public";
  }, [state.transaction]);

  return (
    <Flex flex={1}>
      <Flex px={6} pt={4} pb={2}>
        <Tag type={balanceType === "private" ? "shade" : "color"} textTransform="uppercase">
          {balanceType === "private" ? "Private Transfer" : "Public Transfer"}
        </Tag>
      </Flex>
      <BaseAmountScreen />
    </Flex>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
