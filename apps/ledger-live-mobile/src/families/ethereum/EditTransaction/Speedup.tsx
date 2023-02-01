import {
  Transaction,
  TransactionRaw,
} from "@ledgerhq/live-common/families/ethereum/types";
import { useNavigation } from "@react-navigation/native";
import { fromTransactionRaw } from "@ledgerhq/live-common/families/ethereum/transaction";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";

import { ScreenName } from "../../../const";
import { EthereumEditTransactionParamList } from "../../../components/RootNavigator/types/EthereumEditTransactionNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<
  EthereumEditTransactionParamList,
  ScreenName.SpeedUpTransaction
>;

export function SpeedupTransaction({ route }: Props) {
  const navigation = useNavigation<
    | StackNavigatorNavigation<
        EthereumEditTransactionParamList,
        ScreenName.EthereumCustomFees
      >
    | StackNavigatorNavigation<
        EthereumEditTransactionParamList,
        ScreenName.SendSummary
      >
  >();

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
    transaction,
    currentNavigation: ScreenName.EditEthereumTransactionMethodSelection,
    nextNavigation: ScreenName.SendSelectDevice,
  });
}
