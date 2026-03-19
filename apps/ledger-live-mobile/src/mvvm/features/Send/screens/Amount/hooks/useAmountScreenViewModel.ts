import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowAmountReviewCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import { useAmountInputController } from "./useAmountInputController";
import { useQuickActions } from "./useQuickActions";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import {
  getStatusError,
  pickBlockingError,
} from "@ledgerhq/live-common/flows/send/amount/utils/errors";

type UseAmountScreenViewModelParams = Readonly<{
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
  onSelectCoinControl?: () => void;
}>;

export function useAmountScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
  onReview,
  onGetFunds,
  onSelectCoinControl,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();

  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    transactionActions,
    labels: {
      reviewCta: t("send.newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("send.newSendFlow.getCta", { currency }),
    },
  });

  const {
    mainAccount,
    accountCurrency,
    updateTransactionWithPatch,
    maxAvailable,
    reviewLabel,
    reviewShowIcon: coreReviewShowIcon,
    reviewDisabled: coreReviewDisabled,
    amountComputationPending,
    hasInsufficientFundsError,
    hasRawAmount,
  } = amountReviewCore;

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCoinControl,
  });

  const amountInput = useAmountInputController({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  const setAmountFromRatio = useCallback(
    (nextAmount: BigNumber) => {
      if (maxAvailable.lte(0)) return;
      amountInput.cancelPendingUpdates();
      const safeAmount = BigNumber.max(nextAmount, 0);
      amountInput.updateBothInputs(safeAmount);
      updateTransactionWithPatch({
        amount: safeAmount,
        useAllAmount: false,
      });
    },
    [amountInput, maxAvailable, updateTransactionWithPatch],
  );

  const handleSelectMax = useCallback(() => {
    amountInput.cancelPendingUpdates();
    updateTransactionWithPatch({
      useAllAmount: true,
      amount: new BigNumber(0),
    });
  }, [updateTransactionWithPatch, amountInput]);

  const quickActions = useQuickActions({
    account,
    parentAccount,
    transaction,
    maxAvailable,
    onSetAmountFromRatio: setAmountFromRatio,
    onSelectMax: handleSelectMax,
  });

  const amountError = status.errors?.amount;
  const amountWarningRaw = status.warnings?.amount ?? status.warnings?.feeTooHigh;
  const recipientErrorRaw = getStatusError(status.errors, "recipient");
  const otherBlockingErrorRaw = useMemo(() => {
    const candidate = pickBlockingError(status.errors);
    return candidate?.name === "AmountRequired" ? undefined : candidate;
  }, [status.errors]);

  const isAmountRequiredError = status.errors?.amount?.name === "AmountRequired";

  const isFeeTooHigh =
    status.warnings?.amount?.name === "FeeTooHigh" ||
    status.warnings?.feeTooHigh?.name === "FeeTooHigh";

  const cryptoCurrency =
    accountCurrency.type === "TokenCurrency" ? accountCurrency.parentCurrency : accountCurrency;

  const isStellarMultisignBlocked =
    cryptoCurrency?.family === "stellar" && recipientErrorRaw?.name === "StellarSourceHasMultiSign";

  const amountMessage: AmountScreenMessage | null = (() => {
    if (isStellarMultisignBlocked && recipientErrorRaw) {
      return { type: "error", error: recipientErrorRaw };
    }
    if (amountError && !isAmountRequiredError && hasRawAmount) {
      return { type: "error", error: amountError };
    }
    if (amountWarningRaw && hasRawAmount) {
      return { type: isFeeTooHigh ? "info" : "warning", error: amountWarningRaw };
    }
    if (otherBlockingErrorRaw && hasRawAmount) {
      return { type: "error", error: otherBlockingErrorRaw };
    }
    return null;
  })();

  const reviewDisabled = coreReviewDisabled || amountInput.isTyping;

  return useMemo(
    () => ({
      ready: true,
      amountInput: {
        value: amountInput.value,
        currencyText: amountInput.currencyText,
        currencyPosition: amountInput.currencyPosition,
        secondaryValue: amountInput.secondaryValue,
        maxDecimalLength: amountInput.maxDecimalLength,
        isDisabled: isStellarMultisignBlocked,
        isTyping: amountInput.isTyping,
        onChangeText: amountInput.onChangeText,
        onToggleMode: amountInput.onToggleMode,
      },
      networkFees,
      quickActions: {
        actions: quickActions,
        show: mainAccount.balance.gt(0),
      },
      reviewButton: {
        label: reviewLabel,
        showIcon: coreReviewShowIcon,
        disabled: reviewDisabled,
        loading: amountComputationPending,
        onPress: hasInsufficientFundsError ? onGetFunds : onReview,
      },
      message: amountMessage,
    }),
    [
      amountInput,
      isStellarMultisignBlocked,
      networkFees,
      quickActions,
      mainAccount.balance,
      reviewLabel,
      coreReviewShowIcon,
      hasInsufficientFundsError,
      reviewDisabled,
      amountComputationPending,
      onGetFunds,
      onReview,
      amountMessage,
    ],
  );
}
