import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useEffect } from "react";

import { ScreenName } from "../../../const";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.CancelTransaction
>;

export function CancelTransaction({ route, navigation }: Props) {
  const { operation, account, parentAccount } = route.params;
  const bridge = getAccountBridge(account, parentAccount as Account);

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const { transaction, setTransaction, status } =
    useBridgeTransaction<Transaction>(() => {
      return {
        account,
        parentAccount: parentAccount as Account,
        transaction: transactionToEdit,
      };
    });

  useEffect(() => {
    transactionToEdit.amount = new BigNumber(0);

    if (transactionToEdit.maxPriorityFeePerGas) {
      transactionToEdit.maxPriorityFeePerGas = new BigNumber(
        transactionToEdit.maxPriorityFeePerGas.toNumber() * 1.1,
      );
    }

    if (transactionToEdit.maxFeePerGas) {
      transactionToEdit.maxFeePerGas = new BigNumber(
        transactionToEdit.maxFeePerGas.toNumber() * 1.3,
      );
    }

    setTransaction(bridge.updateTransaction(transaction, transactionToEdit));

    if (transaction) {
      navigation.navigate(ScreenName.SendSelectDevice, {
        accountId: account.id,
        parentId: parentAccount?.id,
        transaction,
        status,
      });
    }
  }, []);

  return null;
}
