import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
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
}>;

export function AmountScreenInner(props: AmountScreenInnerProps) {
  const viewModel = useAmountScreenViewModel(props);

  if (!viewModel.ready) {
    return null;
  }

  return <AmountScreenView viewModel={viewModel} />;
}
