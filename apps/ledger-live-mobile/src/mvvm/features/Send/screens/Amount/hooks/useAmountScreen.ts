import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { ScreenName } from "~/const";
import type { SendFlowNavigationProp } from "../../../types";

type AmountScreenViewModelBase = Readonly<{
  onReview: () => void;
  onGetFunds: () => void;
}>;

export type AmountScreenViewModel =
  | (AmountScreenViewModelBase & { ready: false })
  | (AmountScreenViewModelBase &
      Readonly<{
        ready: true;
        account: AccountLike;
        parentAccount: Account | null;
        transaction: Transaction;
        status: TransactionStatus;
        bridgePending: boolean;
        bridgeError: Error | null;
        uiConfig: SendFlowUiConfig;
        transactionActions: SendFlowTransactionActions;
      }>);

export function useAmountScreen(): AmountScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const onGetFunds = useCallback(() => {
    close();
  }, [close]);

  const onReview = useCallback(() => {
    navigation.navigate(ScreenName.SendFlowConfirmation);
  }, [navigation]);

  if (!account || !transaction || !status || !uiConfig || !transactionActions) {
    return { ready: false, onReview, onGetFunds };
  }

  return {
    ready: true,
    account,
    parentAccount: parentAccount ?? null,
    transaction,
    status,
    bridgePending: bridgePending ?? false,
    bridgeError: bridgeError ?? null,
    uiConfig,
    transactionActions,
    onReview,
    onGetFunds,
  };
}
