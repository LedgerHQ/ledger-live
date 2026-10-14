import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import { useFlowEffects } from "@ledgerhq/live-common/flows/send/effects/hooks/useFlowEffects";
import { useAmountScreenViewModel } from "../hooks/useAmountScreenViewModel";
import { AmountScreenView } from "./AmountScreenView";
import { useSendFlowMessageTracking } from "../../../hooks/useSendFlowMessageTracking";
import { createTrackedMessage } from "../../../utils/messageTracking";

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

  const flowEffects = useFlowEffects({
    account: props.account,
    parentAccount: props.parentAccount,
    transaction: props.transaction,
    currency,
    updateTransaction: props.transactionActions.updateTransaction,
  });

  const viewModel = useAmountScreenViewModel(props);

  const { account, parentAccount, transaction, status, bridgeError, bridgePending } = props;
  const amountMessage = viewModel.ready ? viewModel.message : null;
  const messageTrackingRequest = useMemo(() => {
    const visibleMessageError = amountMessage?.error;
    const hiddenAmountRequired =
      status.errors.amount?.name === "AmountRequired" ? status.errors.amount : null;
    const maxFeeWarning =
      status.warnings.maxFee?.name === "MaxFeeTooLow" ? status.warnings.maxFee : null;
    const primaryError =
      visibleMessageError ?? bridgeError ?? maxFeeWarning ?? hiddenAmountRequired;

    if (!primaryError) return null;

    const balance =
      getSelectedBalanceTypeBalance(account, transaction) ??
      account.spendableBalance ??
      account.balance;
    const amount = transaction.amount;
    const amountRatioToBalance =
      amount && balance?.gt(0) ? amount.dividedBy(balance).toNumber() : null;

    return {
      account,
      parentAccount,
      step: SEND_FLOW_STEP.AMOUNT,
      message: createTrackedMessage(
        primaryError,
        primaryError === maxFeeWarning || (visibleMessageError && amountMessage?.type !== "error")
          ? "warning"
          : "error",
        status,
        bridgeError ? [bridgeError.name] : [],
      ),
      metadata: { amountRatioToBalance },
    };
  }, [account, amountMessage, bridgeError, parentAccount, status, transaction]);
  useSendFlowMessageTracking({
    step: SEND_FLOW_STEP.AMOUNT,
    request: messageTrackingRequest,
    isTransient:
      bridgePending || flowEffects.loading || (viewModel.ready && viewModel.reviewButton.loading),
  });

  if (!viewModel.ready) {
    return null;
  }

  return <AmountScreenView viewModel={viewModel} />;
}
