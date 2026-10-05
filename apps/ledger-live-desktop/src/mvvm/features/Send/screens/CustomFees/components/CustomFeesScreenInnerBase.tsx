import React, { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import { useCustomFeesViewModel } from "../hooks/useCustomFeesViewModel";
import { CustomFeesScreenView } from "./CustomFeesScreenView";
import { useSendFlowMessageTracking } from "../../../hooks/useSendFlowMessageTracking";
import { getSuppressedMessageIds } from "../../../utils/messageTracking";

export type CustomFeesScreenInnerBaseProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
  isFlowEffectLoading?: boolean;
}>;

export function CustomFeesScreenInnerBase({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
  isFlowEffectLoading = false,
}: CustomFeesScreenInnerBaseProps) {
  const viewModel = useCustomFeesViewModel({
    account,
    parentAccount,
    transaction,
    status,
    currency,
    transactionActions,
    onConfirm,
  });

  const messageTrackingRequest = useMemo(() => {
    const inputsWithErrors = viewModel.inputs.filter(input => input.errorId);
    const primary = inputsWithErrors[0];
    if (!primary?.errorId) return null;

    const balance =
      getSelectedBalanceTypeBalance(account, transaction) ??
      account.spendableBalance ??
      account.balance;
    const amountRatioToBalance =
      transaction.amount && balance?.gt(0)
        ? transaction.amount.dividedBy(balance).toNumber()
        : null;

    return {
      account,
      parentAccount,
      step: SEND_FLOW_STEP.CUSTOM_FEES,
      message: {
        messageId: primary.errorId,
        messageType: "error" as const,
        suppressedErrors: getSuppressedMessageIds(
          status,
          primary.errorId,
          inputsWithErrors
            .slice(1)
            .map(input => input.errorId)
            .filter((errorId): errorId is string => errorId != null),
        ),
      },
      metadata: { amountRatioToBalance },
    };
  }, [account, parentAccount, status, transaction, viewModel.inputs]);
  useSendFlowMessageTracking({
    step: SEND_FLOW_STEP.CUSTOM_FEES,
    request: messageTrackingRequest,
    debounceKey: viewModel.inputs.map(input => `${input.value}:${input.errorId ?? ""}`).join("|"),
    isTransient: isFlowEffectLoading,
  });

  return (
    <CustomFeesScreenView
      inputs={viewModel.inputs}
      fiatLabel={viewModel.fiatLabel}
      fiatValue={viewModel.fiatValue}
      isConfirmDisabled={viewModel.isConfirmDisabled}
      onInputChange={viewModel.onInputChange}
      onInputClear={viewModel.onInputClear}
      onConfirm={viewModel.onConfirm}
      hasCustomAssets={viewModel.hasCustomAssets}
      assetOptions={viewModel.assetOptions}
      selectedAssetId={viewModel.selectedAssetId}
      onAssetChange={viewModel.onAssetChange}
      confirmLabel={viewModel.confirmLabel}
      suggestedLabel={viewModel.suggestedLabel}
      payFeesInLabel={viewModel.payFeesInLabel}
    />
  );
}
