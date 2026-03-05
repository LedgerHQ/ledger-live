import {
  SEND_FLOW_STEP,
  type SendFlowTransactionActions,
  type SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useNavigate } from "react-router";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useCallback } from "react";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

export type CoinControlScreenViewModel =
  | { ready: false }
  | {
      ready: true;
      account: AccountLike;
      parentAccount: Account | null;
      transaction: Transaction;
      status: TransactionStatus;
      bridgePending: boolean;
      bridgeError: Error | null;
      uiConfig: SendFlowUiConfig;
      transactionActions: SendFlowTransactionActions;
      onReview: () => void;
      onGetFunds: () => void;
    };

export function useCoinControlScreen(): CoinControlScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const { navigation } = useFlowWizard();
  const navigate = useNavigate();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const onReview = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.SIGNATURE);
  }, [navigation]);

  const onGetFunds = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);
    const currencyId = "currency" in mainAccount ? mainAccount.currency.id : undefined;

    navigate("/exchange", {
      state: {
        currency: currencyId,
        account: mainAccount.id,
        mode: "buy",
      },
    });
    close();
  }, [account, close, navigate, parentAccount]);

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
    bridgeError,
    uiConfig,
    transactionActions,
    onReview,
    onGetFunds,
  };
}
