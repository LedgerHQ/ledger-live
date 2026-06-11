import {
  type SendFlowTransactionActions,
  type SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { SendFlowNavigationProp } from "../../../types";

export type CoinControlScreenViewModel =
  | { ready: false }
  | {
      ready: true;
      account: AccountLike;
      parentAccount: Account | null;
      transaction: Transaction;
      status: TransactionStatus;
      bridgePending: boolean;
      uiConfig: SendFlowUiConfig;
      transactionActions: SendFlowTransactionActions;
      onReview: () => void;
      onGetFunds: () => void;
    };

export function useCoinControlScreen(): CoinControlScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const { account, parentAccount } = state.account;
  const { bridgePending, status, transaction } = state.transaction;

  const onReview = useCallback(() => {
    navigation.navigate(ScreenName.SendFlowSignature);
  }, [navigation]);

  const onGetFunds = useCallback(() => {
    close();
  }, [close]);

  if (!account || !transaction || !status || !uiConfig || !transactionActions) {
    return { ready: false };
  }

  return {
    ready: true,
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    uiConfig,
    transactionActions,
    onReview,
    onGetFunds,
  };
}
