import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { SendFlowNavigationProp } from "../../../types";

export type CustomFeesScreenViewModel =
  | { ready: false }
  | {
      ready: true;
      account: AccountLike;
      parentAccount: Account | null;
      transaction: Transaction;
      status: TransactionStatus;
      transactionActions: SendFlowTransactionActions;
      onConfirm: () => void;
    };

export function useCustomFeesScreen(): CustomFeesScreenViewModel {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const { account, parentAccount } = state.account;
  const { status, transaction } = state.transaction;

  const onConfirm = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!account || !transaction || !status || !transactionActions) {
    return { ready: false };
  }

  return {
    ready: true,
    account,
    parentAccount: parentAccount ?? null,
    transaction,
    status,
    transactionActions,
    onConfirm,
  };
}
