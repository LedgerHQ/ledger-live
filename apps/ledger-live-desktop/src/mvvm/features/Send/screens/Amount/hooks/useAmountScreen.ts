import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";

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
  const { navigation } = useFlowWizard();
  const navigate = useNavigate();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

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

  const onReview = useCallback(() => {
    navigation.goToNextStep();
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
