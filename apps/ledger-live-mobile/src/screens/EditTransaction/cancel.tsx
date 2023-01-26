import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import BigNumber from "bignumber.js";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";

import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import { EthereumEditTransactionParamList } from "../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import LText from "../../components/LText";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.CancelTransaction
>;

export function CancelTransaction({ route }: Props) {
  const { operation } = route.params;

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  transactionToEdit.amount = new BigNumber(0);

  return (
    <Flex flex={1} color="background.main">
      <TrackScreen
        category="EthereumEditTransaction"
        name="EthereumEditTransaction"
      />
      <Flex p={6}>
        <LText>Hello world</LText>
      </Flex>
    </Flex>
  );
}
