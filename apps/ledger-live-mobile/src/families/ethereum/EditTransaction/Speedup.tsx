import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";

import { ScreenName } from "../../../const";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.SpeedUpTransaction
>;

export function SpeedupTransaction({ route, navigation }: Props) {
  // hack to bypass this page when coming from the SendSummary screen
  navigation.goBack();

  const { operation, account, parentAccount } = route.params;

  const transactionToEdit = fromTransactionRaw(
    operation.transactionRaw! as TransactionRaw,
  ) as Transaction;

  const { transaction } = useBridgeTransaction<Transaction>(() => {
    return {
      account,
      parentAccount: parentAccount as Account,
      transaction: transactionToEdit,
    };
  });

  invariant(transaction, "Couldn't found transaction");

  if (!transaction) {
    return null;
  }

  navigation.navigate(ScreenName.SendSummary, {
    accountId: account.id,
    parentId: parentAccount?.id,
    isEdit: true,
    transaction,
    currentNavigation: ScreenName.EditEthereumTransactionMethodSelection,
    nextNavigation: ScreenName.SendSelectDevice,
  });

  return null;
}
