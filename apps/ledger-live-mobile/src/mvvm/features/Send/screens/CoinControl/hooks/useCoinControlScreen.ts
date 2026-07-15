import {
  type SendFlowTransactionActions,
  type SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useSendSignature } from "../../../context/SendSignatureContext";
import type { SendFlowNavigationProp } from "../../../types";

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
  const { startSigning } = useSendSignature();
  const navigation = useNavigation<SendFlowNavigationProp>();

  const { account, parentAccount } = state.account;
  const { bridgePending, status, transaction } = state.transaction;

  const onReview = useCallback(() => {
    startSigning(() => navigation.navigate(ScreenName.SendFlowConfirmation));
  }, [startSigning, navigation]);

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
