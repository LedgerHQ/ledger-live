import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowAmountReviewCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore";
import { getNativeSpendableAfterPending } from "@ledgerhq/live-common/bridge/generic-coin-framework/utils";
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import type { AmountScreenViewModel } from "../types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useAmountInput } from "./useAmountInput";
import { useQuickActions } from "./useQuickActions";
import { useInitialTransactionPreparation } from "../../../hooks/useInitialTransactionPreparation";
import { useAmountScreenMessage } from "./useAmountScreenMessage";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { track } from "~/renderer/analytics/segment";
import { useSendFlowTrackingProperties } from "../../../hooks/useSendFlowTrackingProperties";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onSelectCoinControl: () => void;
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
  onSelectCoinControl,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();
  const { navigation } = useFlowWizard();
  const { selectedFeeOptionId, available, quote, intentReady, feeLoading } = useSponsoredSend();

  const sendFlowTrackingProperties = useSendFlowTrackingProperties();

  // Tronify covers the network fee via rented energy, so the native NotEnoughGas (`gasLimit`) error
  // validateIntent raises for a low-TRX TRC-20 send must not gate Review on the sponsored path once
  // an affordable quote is loaded — that low-TRX account is exactly whom the feature serves. Strip
  // only that one error for the review-gating core; every other validation error still blocks, and
  // the unaffordable case is caught by `sponsoredFeeUnaffordable` below.
  const sponsoredCoversNativeFee = selectedFeeOptionId === "tronify" && available && !!quote;
  const reviewStatus = useMemo(() => {
    if (!sponsoredCoversNativeFee || !status.errors?.gasLimit) return status;
    const { gasLimit: _gasLimit, ...errors } = status.errors;
    return { ...status, errors };
  }, [sponsoredCoversNativeFee, status]);

  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status: reviewStatus,
    bridgePending,
    transactionActions,
    labels: {
      reviewCta: t("newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("newSendFlow.getCta", { currency }),
    },
  });

  const {
    mainAccount,
    updateTransactionWithPatch,
    maxAvailable,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled,
    amountComputationPending,
    shouldPrepare,
  } = amountReviewCore;

  const sponsoredFeeUnaffordable = useMemo(() => {
    if (selectedFeeOptionId !== "tronify" || !available || !quote) return false;
    // Compare against the pending-adjusted native balance, not the raw spendableBalance: optimistic
    // pendingOperations don't hit spendableBalance until the next sync, so a pending native TRX send
    // would otherwise leave Tronify enabled when the rent payment no longer fits.
    return getNativeSpendableAfterPending(mainAccount).lt(new BigNumber(quote.value.toString()));
  }, [selectedFeeOptionId, available, quote, mainAccount]);

  const amountInput = useAmountInput({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => updateTransactionWithPatch({}),
  });

  const quickActionsAvailableBalance = useMemo(() => {
    // Coins drawing from several pools (ex: Zcash transparent vs shielded) spend only the
    // pool picked on the balance-type step, so the ratios apply to it and not to the
    // account total, which sums pools the transaction cannot touch.
    const selectedPoolBalance = getSelectedBalanceTypeBalance(account, transaction);
    if (selectedPoolBalance) return selectedPoolBalance;
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account, transaction]);

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

  const { amountMessage, isAmountInputDisabled } = useAmountScreenMessage({
    // Feed reviewStatus so the amount message drops the gasLimit/NotEnoughGas the sponsored review gate
    // already waived and doesn't contradict an enabled Review button.
    status: reviewStatus,
    hasRawAmount: amountReviewCore.hasRawAmount,
  });

  const onOpenCustomFees = useCallback(() => {
    track("button_clicked", {
      button: "fee custom",
      page: "step amount",
      ...sendFlowTrackingProperties,
    });
    navigation.goToStep(SEND_FLOW_STEP.CUSTOM_FEES);
  }, [navigation, sendFlowTrackingProperties]);

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCustomFees: onOpenCustomFees,
    onSelectCoinControl,
  });

  const trackedFeeSelectorOptions = useMemo(
    () =>
      networkFees.feeSelector.options.map(option => {
        // Only preset/default strategy picks were tracked here previously (the "fee <id>"
        // button event); custom/coinControl already carry their own tracking (onOpenCustomFees)
        // or never had tracking (onSelectCoinControl) — preserve that exactly.
        if (option.kind !== "preset" && option.kind !== "default") return option;
        return {
          ...option,
          onSelect: () => {
            track("button_clicked", {
              button: `fee ${option.id}`,
              page: "step amount",
              ...sendFlowTrackingProperties,
            });
            option.onSelect();
          },
        };
      }),
    [networkFees.feeSelector.options, sendFlowTrackingProperties],
  );

  const trackedQuickActions = useMemo(
    () =>
      quickActions.map(action => ({
        ...action,
        onClick: () => {
          if (!action.active) {
            track("button_clicked", {
              button: action.id,
              page: "step amount",
              ...sendFlowTrackingProperties,
            });
          }
          action.onClick();
        },
      })),
    [quickActions, sendFlowTrackingProperties],
  );

  return {
    amountValue: amountInput.amountValue,
    amountInputMaxDecimalLength: amountInput.amountInputMaxDecimalLength,
    currencyText: amountInput.currencyText,
    currencyPosition: amountInput.currencyPosition,
    isInputDisabled: isAmountInputDisabled,
    onAmountChange: amountInput.onAmountChange,
    onToggleInputMode: amountInput.onToggleInputMode,
    toggleLabel: t("newSendFlow.switchInputMode"),
    secondaryValue: amountInput.secondaryValue,
    inputMode: amountInput.inputMode,
    quickActions: trackedQuickActions,
    showQuickActions: quickActionsAvailableBalance.gt(0),
    amountMessage,
    reviewLabel,
    reviewShowIcon,
    reviewDisabled: reviewDisabled || sponsoredFeeUnaffordable,
    sponsoredFeeError: sponsoredFeeUnaffordable
      ? t("newSendFlow.feePayment.insufficientFunds")
      : null,
    // Keep loading while a selected Tronify option is still rebuilding its intent OR still fetching its
    // quote: onReview blocks the rent-signing route until the intent is ready, and sponsoredFeeUnaffordable
    // needs the quote. `available` stays true across a quote refetch, so gate on the quote too to hold
    // Review until that affordability check can run.
    reviewLoading:
      amountComputationPending ||
      (selectedFeeOptionId === "tronify" && available && (!intentReady || (!quote && feeLoading))),
    ...networkFees,
    feeSelector: {
      ...networkFees.feeSelector,
      options: trackedFeeSelectorOptions,
    },
  };
}
