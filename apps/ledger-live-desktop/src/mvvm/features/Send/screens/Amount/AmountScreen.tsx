import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
  useSendFlowActions,
  useSendFlowData,
  useSendFlowNavigation,
} from "../../context/SendFlowContext";
import { AmountScreenView } from "./components/AmountScreenView";
import { useAmountScreenViewModel } from "./hooks/useAmountScreenViewModel";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../../types";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { AmountPluginsHost } from "./components/AmountPluginsHost";

export function AmountScreen() {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const { navigation } = useSendFlowNavigation();
  const history = useHistory();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const handleGetFunds = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);
    const currencyId = "currency" in mainAccount ? mainAccount.currency.id : undefined;

    // Navigate to exchange (Buy) page with preselected currency (same behavior as Buy button)
    history.push({
      pathname: "/exchange",
      state: {
        currency: currencyId,
        account: mainAccount.id,
        mode: "buy",
      },
    });
    // Close the send flow dialog
    close();
  }, [account, history, close, parentAccount]);

  if (!account || !transaction || !status) {
    return null;
  }

  return (
    <AmountScreenInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      status={status}
      bridgePending={bridgePending}
      bridgeError={bridgeError}
      uiConfig={uiConfig}
      transactionActions={transactionActions}
      onReview={() => navigation.goToNextStep()}
      onGetFunds={handleGetFunds}
    />
  );
}

type AmountScreenInnerProps = Readonly<{
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
}>;

function AmountScreenInner({
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
}: AmountScreenInnerProps) {
  const handleReview = useCallback(() => {
    onReview();
  }, [onReview]);

  const viewModel = useAmountScreenViewModel({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    bridgeError,
    uiConfig,
    transactionActions,
  });

  return (
    <>
      <AmountPluginsHost
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        transactionActions={transactionActions}
      />
      <AmountScreenView
        {...viewModel}
        account={account}
        parentAccount={parentAccount}
        transaction={transaction}
        status={status}
        onReview={handleReview}
        onGetFunds={onGetFunds}
      />
    </>
  );
}
