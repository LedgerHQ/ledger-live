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
import { useAmountUsd } from "./useAmountUsd";
import { useQuickActions } from "./useQuickActions";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import {
  getAmountScreenRawMessage,
  isAmountInputDisabledByRecipientError,
} from "@ledgerhq/live-common/flows/send/amount/utils/messages";

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
  onSelectCustomFees?: () => void;
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
  onSelectCustomFees,
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
    updateTransactionWithPatch,
    maxAvailable,
    reviewLabel,
    reviewShowIcon: coreReviewShowIcon,
    reviewDisabled: coreReviewDisabled,
    amountComputationPending,
    hasInsufficientFundsError,
    hasRawAmount,
  } = amountReviewCore;

  const quickActionsAvailableBalance = useMemo(() => {
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account]);

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCoinControl,
    onSelectCustomFees,
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
    availableBalance: quickActionsAvailableBalance,
    onSetAmountFromRatio: setAmountFromRatio,
    onSelectMax: handleSelectMax,
  });

  const amountMessage: AmountScreenMessage | null = useMemo(
    () => getAmountScreenRawMessage({ status, hasRawAmount }),
    [hasRawAmount, status],
  );
  const isAmountInputDisabled = useMemo(
    () => isAmountInputDisabledByRecipientError(status),
    [status],
  );

  const reviewDisabled = coreReviewDisabled || amountInput.isTyping;

  const { track } = useAnalytics();
  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount),
    [account, parentAccount],
  );

  const amountUsd = useAmountUsd(account, transaction.amount, amountInput.fiatAmountValue);

  const handleReview = useCallback(() => {
    track("button_clicked", {
      ...trackingProperties,
      button: "review",
      page: "step amount",
      amount: amountUsd,
      input_mode: amountInput.inputMode,
    });
    onReview();
  }, [onReview, amountUsd, amountInput.inputMode, track, trackingProperties]);

  return useMemo(
    () => ({
      ready: true,
      amountInput: {
        value: amountInput.value,
        currencyText: amountInput.currencyText,
        currencyPosition: amountInput.currencyPosition,
        secondaryValue: amountInput.secondaryValue,
        maxDecimalLength: amountInput.maxDecimalLength,
        isDisabled: isAmountInputDisabled,
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
        onPress: hasInsufficientFundsError ? onGetFunds : handleReview,
      },
      message: amountMessage,
    }),
    [
      amountInput,
      isAmountInputDisabled,
      networkFees,
      quickActions,
      mainAccount.balance,
      reviewLabel,
      coreReviewShowIcon,
      hasInsufficientFundsError,
      reviewDisabled,
      amountComputationPending,
      onGetFunds,
      handleReview,
      amountMessage,
    ],
  );
}
