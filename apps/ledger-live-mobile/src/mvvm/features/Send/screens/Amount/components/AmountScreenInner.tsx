import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
import { AmountPluginsHost } from "./AmountPluginsHost";

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
}>;

export function AmountScreenInner(props: AmountScreenInnerProps) {
  const viewModel = useAmountScreenViewModel(props);

  const pluginsSlot = useMemo(
    () => (
      <AmountPluginsHost
        account={props.account}
        parentAccount={props.parentAccount}
        transaction={props.transaction}
        transactionActions={props.transactionActions}
      />
    ),
    [props.account, props.parentAccount, props.transaction, props.transactionActions],
  );

  if (!viewModel.ready) {
    return null;
  }

  return <AmountScreenView viewModel={viewModel} pluginsSlot={pluginsSlot} />;
}
