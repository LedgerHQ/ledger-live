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
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import type { SponsoredFeeAmounts } from "@ledgerhq/live-common/flows/send/sponsored/types";
import type { SponsoredFeeEntryViewModel } from "../../../types";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import { useAmountInputController } from "./useAmountInputController";
import { useQuickActions } from "./useQuickActions";
import { withoutWaivedStatus } from "@ledgerhq/live-common/flows/send/sponsored/waivedStatus";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import {
  getAmountScreenRawMessage,
  isAmountInputDisabledByRecipientError,
} from "@ledgerhq/live-common/flows/send/amount/utils/messages";

const PENDING_SPONSORED_FEE: SponsoredFeeAmounts["sponsored"] = {
  value: "-",
  secondaryValue: null,
  originalValue: null,
};

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
  const {
    waivesNativeFee,
    waivesErrorKeys,
    waivesWarningKeys,
    reviewReady,
    available: sponsoredAvailable,
    sponsoredSelected,
    providerName,
    feeCurrencyTicker,
    savingsFiatFormatted,
    sponsoredFeeAmounts,
    sponsoredUnaffordable,
  } = useSponsoredSend();

  const statusWithoutWaived = useMemo(
    () =>
      waivesNativeFee ? withoutWaivedStatus(status, waivesErrorKeys, waivesWarningKeys) : status,
    [waivesNativeFee, waivesErrorKeys, waivesWarningKeys, status],
  );

  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status: statusWithoutWaived,
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
    // Coins drawing from several pools (ex: Zcash transparent vs shielded) spend only the
    // pool picked on the balance-type step, so the ratios apply to it and not to the
    // account total, which sums pools the transaction cannot touch.
    const selectedPoolBalance = getSelectedBalanceTypeBalance(account, transaction);
    if (selectedPoolBalance) return selectedPoolBalance;
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account, transaction]);

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
    () => getAmountScreenRawMessage({ status: statusWithoutWaived, hasRawAmount }),
    [hasRawAmount, statusWithoutWaived],
  );
  const isAmountInputDisabled = useMemo(
    () => isAmountInputDisabledByRecipientError(status),
    [status],
  );

  const sponsoredFee: SponsoredFeeEntryViewModel | null = useMemo(() => {
    if (!sponsoredAvailable) return null;
    let label: string | null;
    if (sponsoredSelected) {
      label = savingsFiatFormatted
        ? t("send.newSendFlow.feePayment.saved", { provider: providerName })
        : null;
    } else if (savingsFiatFormatted) {
      label = t("send.newSendFlow.feePayment.nudge", {
        amount: savingsFiatFormatted,
        provider: providerName,
      });
    } else {
      // Offered even without a saving: paying in the fee asset can be what makes the send possible.
      label = t("send.newSendFlow.feePayment.payIn", { feeCurrency: feeCurrencyTicker });
    }
    return {
      label,
      selected: sponsoredSelected,
      // While the quote reloads, falling back to the standard estimate would misstate the chosen fee.
      fee: sponsoredSelected ? (sponsoredFeeAmounts?.sponsored ?? PENDING_SPONSORED_FEE) : null,
      infoDescription: sponsoredSelected
        ? t("send.newSendFlow.feePayment.disclaimer", {
            feeCurrency: feeCurrencyTicker,
            provider: providerName,
          })
        : null,
      error: sponsoredUnaffordable
        ? t("send.newSendFlow.feePayment.insufficientFunds", {
            feeCurrency: feeCurrencyTicker,
            provider: providerName,
          })
        : null,
    };
  }, [
    sponsoredAvailable,
    sponsoredSelected,
    savingsFiatFormatted,
    sponsoredFeeAmounts,
    sponsoredUnaffordable,
    providerName,
    feeCurrencyTicker,
    t,
  ]);

  // An insufficient amount turns Review into Get funds, which needs no sponsored quote and stays
  // pressable.
  const sponsoredReviewNotReady = !reviewReady && !hasInsufficientFundsError;
  const reviewDisabled =
    coreReviewDisabled ||
    amountInput.isTyping ||
    sponsoredReviewNotReady ||
    (sponsoredUnaffordable && !hasInsufficientFundsError);
  const reviewLoading = amountComputationPending || sponsoredReviewNotReady;

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
      sponsoredFee,
      quickActions: {
        actions: quickActions,
        show: mainAccount.balance.gt(0),
      },
      reviewButton: {
        label: reviewLabel,
        showIcon: coreReviewShowIcon,
        disabled: reviewDisabled,
        loading: reviewLoading,
        onPress: hasInsufficientFundsError ? onGetFunds : onReview,
      },
      message: amountMessage,
    }),
    [
      amountInput,
      isAmountInputDisabled,
      networkFees,
      sponsoredFee,
      quickActions,
      mainAccount.balance,
      reviewLabel,
      coreReviewShowIcon,
      hasInsufficientFundsError,
      reviewDisabled,
      reviewLoading,
      onGetFunds,
      onReview,
      amountMessage,
    ],
  );
}
