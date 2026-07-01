import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";

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
  onSelectCoinControl: () => void;
  onSelectCustomFees: () => void;
}>;

export function AmountScreenInner(props: AmountScreenInnerProps) {
  const mainAccount = useMemo(
    () => getMainAccount(props.account, props.parentAccount ?? undefined),
    [props.account, props.parentAccount],
  );
  const currency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  useFlowEffects({
    account: props.account,
    parentAccount: props.parentAccount,
    transaction: props.transaction,
    currency,
    updateTransaction: props.transactionActions.updateTransaction,
  });

  const viewModel = useAmountScreenViewModel(props);

  if (!viewModel.ready) {
    return null;
  }

  return <AmountScreenView viewModel={viewModel} />;
}
