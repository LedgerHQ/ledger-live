import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation, useLocale } from "~/context/Locale";
import { formatCurrencyUnit } from "@ledgerhq/live-currency-format";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowAmountReviewCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore";
import { getSelectedBalanceTypeBalance } from "@ledgerhq/live-send";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import { useAmountInputController } from "./useAmountInputController";
import { useQuickActions } from "./useQuickActions";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useSponsoredSend } from "../../../context/SponsoredSendContext";
import type { TronifyFeesViewModel, NetworkFeesViewModel } from "../../../types";
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

  // ─── Tronify fee-selector integration (LIVE-33403) ──────────────────────────
  const { locale } = useLocale();
  const {
    selectedFeeOptionId,
    selectTronify,
    selectStandard,
    available: tronifyAvailable,
    quote: tronifyQuote,
    savingsFiatFormatted,
  } = useSponsoredSend();
  const tronifySelected = selectedFeeOptionId === "tronify";

  const tokenCurrency = useMemo(() => getAccountCurrency(account), [account]);
  const mainAccountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const discountedFeeFormatted = useMemo(() => {
    if (!tronifyQuote) return null;
    return formatCurrencyUnit(
      tokenCurrency.units[0],
      new BigNumber(tronifyQuote.value.toString()),
      { showCode: true, disableRounding: false, locale },
    );
  }, [tronifyQuote, tokenCurrency, locale]);

  const originalFeeFormatted = useMemo(() => {
    if (!tronifyQuote) return null;
    return formatCurrencyUnit(
      mainAccountCurrency.units[0],
      new BigNumber(tronifyQuote.originalValue.toString()),
      { showCode: true, disableRounding: false, locale },
    );
  }, [tronifyQuote, mainAccountCurrency, locale]);

  const tronifyInsufficientBalance = useMemo(() => {
    if (!tronifySelected || !tronifyQuote || !transaction) return false;
    const spendable = "spendableBalance" in account ? account.spendableBalance : null;
    if (!spendable) return false;
    const needed = transaction.amount.plus(new BigNumber(tronifyQuote.value.toString()));
    return spendable.lt(needed);
  }, [tronifySelected, tronifyQuote, transaction, account]);

  const tronify = useMemo<TronifyFeesViewModel | null>(() => {
    if (!tronifyAvailable) return null;
    return {
      available: tronifyAvailable,
      selected: tronifySelected,
      discountedFeeFormatted,
      originalFeeFormatted,
      savingsFiatFormatted,
      onSelectTronify: selectTronify,
      onSelectStandard: selectStandard,
      insufficientBalance: tronifyInsufficientBalance,
    };
  }, [
    tronifyAvailable,
    tronifySelected,
    discountedFeeFormatted,
    originalFeeFormatted,
    savingsFiatFormatted,
    selectTronify,
    selectStandard,
    tronifyInsufficientBalance,
  ]);

  const finalNetworkFees = useMemo<NetworkFeesViewModel>(() => {
    const base: NetworkFeesViewModel = { ...networkFees, tronify };
    if (!tronifySelected || !discountedFeeFormatted) return base;
    return {
      ...base,
      value: discountedFeeFormatted,
      secondaryValue: originalFeeFormatted,
      secondaryValueStrikethrough: true,
      strategyLabel: t("send.newSendFlow.feeSelector.viaTronify"),
      displayOptions: [],
      canOpenSelector: true,
      networkFeesInfo: null,
    };
  }, [networkFees, tronify, tronifySelected, discountedFeeFormatted, originalFeeFormatted, t]);
  // ─────────────────────────────────────────────────────────────────────────────

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

  const reviewDisabled = coreReviewDisabled || amountInput.isTyping || tronifyInsufficientBalance;

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
      networkFees: finalNetworkFees,
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
      isAmountInputDisabled,
      finalNetworkFees,
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
