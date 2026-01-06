import { useCallback, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowUiConfig, SendFlowTransactionActions } from "../../../types";
import { useTranslatedBridgeError } from "../../Recipient/hooks/useTranslatedBridgeError";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useAmountInput } from "./useAmountInput";
import { useQuickActions } from "./useQuickActions";
import { useFeeInfo } from "./useFeeInfo";
import { useFeePresetOptions } from "./useFeePresetOptions";
import { useFeePresetFiatValues } from "./useFeePresetFiatValues";
import { useFeePresetLegends } from "./useFeePresetLegends";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

function getStatusError(
  errors: TransactionStatus["errors"] | undefined,
  key: string,
): Error | undefined {
  if (!errors) return undefined;
  return errors[key];
}

function pickBlockingError(errors: TransactionStatus["errors"] | undefined): Error | undefined {
  if (!errors) return undefined;

  // Prefer errors that are commonly tied to amount validity on UTXO chains.
  const priorityKeys = ["dustLimit", "recipient", "fees", "transaction"] as const;
  for (const key of priorityKeys) {
    const err = errors[key];
    if (err) return err;
  }

  return Object.values(errors).find(Boolean);
}

function getAmountScreenMessage(params: {
  amountErrorTitle?: string;
  amountWarningTitle?: string;
  isFeeTooHigh: boolean;
  hasRawAmount: boolean;
}): AmountScreenMessage | null {
  if (params.amountErrorTitle && params.hasRawAmount) {
    return { type: "error", text: params.amountErrorTitle };
  }
  if (params.amountWarningTitle && params.hasRawAmount) {
    return { type: params.isFeeTooHigh ? "info" : "warning", text: params.amountWarningTitle };
  }
  return null;
}

export function useAmountScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatUnit = counterValueCurrency.units[0];
  const feePresetOptions = useFeePresetOptions(accountCurrency, transaction);
  const hasFeePresets = sendFeatures.hasFeePresets(accountCurrency);
  const shouldEstimateFeePresetsWithBridge = sendFeatures.shouldEstimateFeePresetsWithBridge(
    accountCurrency,
    transaction,
  );
  const shouldForceBridgeEstimationForEvm =
    hasFeePresets && transaction.family === "evm" && feePresetOptions.length === 0;
  const shouldEstimateFeePresets =
    shouldEstimateFeePresetsWithBridge || shouldForceBridgeEstimationForEvm;
  const fiatByPreset = useFeePresetFiatValues({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions,
    fallbackPresetIds: shouldForceBridgeEstimationForEvm ? ["slow", "medium", "fast"] : undefined,
    counterValueCurrency,
    fiatUnit,
    enabled: hasFeePresets,
    shouldEstimateWithBridge: shouldEstimateFeePresets,
  });
  const legendByPreset = useFeePresetLegends({
    currency: accountCurrency,
    feePresetOptions,
  });

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        const bridge = getAccountBridge(account, parentAccount ?? undefined);
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [account, parentAccount, transactionActions],
  );

  const amountInput = useAmountInput({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;
  const amountComputationPending = bridgePending && shouldPrepare;

  // Trigger initial transaction preparation to fetch fee estimates (networkInfo for Bitcoin)
  // This is done when account changes or when recipient is set for the first time
  // Scheduled as a microtask to avoid render-phase side effects while maintaining
  // execution order
  const lastPreparedKeyRef = useRef<string | null>(null);
  const mainAccountId = mainAccount.id;
  const recipientAddress = transaction.recipient ?? "";
  const prepareKey = shouldPrepare ? `${mainAccountId}-${recipientAddress}` : null;

  if (
    prepareKey &&
    lastPreparedKeyRef.current !== prepareKey &&
    transaction &&
    !bridgePending &&
    recipientAddress
  ) {
    lastPreparedKeyRef.current = prepareKey;

    queueMicrotask(() => {
      // Trigger a transaction update to ensure networkInfo is populated
      // This will call prepareTransaction on the bridge, fetching fee presets
      updateTransactionWithPatch({});
    });
  }

  const maxAvailable = useMemo(() => {
    if (!account) return new BigNumber(0);
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = spendable ?? account.balance ?? new BigNumber(0);

    // For ratios (25%, 50%, 75%), we need to account for fees to avoid insufficient funds
    // Subtract estimated fees to get a safer maxAvailable
    const estimatedFees = status.estimatedFees ?? new BigNumber(0);
    const safeMax = balance.minus(estimatedFees);

    return BigNumber.max(0, safeMax);
  }, [account, status.estimatedFees]);

  const quickActionsAvailableBalance = useMemo(() => {
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account]);

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

  const { feeSummary } = useFeeInfo({
    account,
    parentAccount,
    status,
  });

  const amountError = useTranslatedBridgeError(status.errors?.amount);
  const amountWarning = useTranslatedBridgeError(status.warnings?.amount);
  const recipientErrorRaw = getStatusError(status.errors, "recipient");
  const recipientError = useTranslatedBridgeError(recipientErrorRaw);
  const otherBlockingErrorRaw = useMemo(() => pickBlockingError(status.errors), [status.errors]);
  const otherBlockingError = useTranslatedBridgeError(otherBlockingErrorRaw);
  const shouldHideAmountRequired =
    amountComputationPending && status.errors?.amount?.name === "AmountRequired" && !hasRawAmount;
  const amountErrorTitle = amountError && !shouldHideAmountRequired ? amountError.title : undefined;
  const amountWarningTitle = amountWarning ? amountWarning.title : undefined;
  const isFeeTooHigh = status.warnings?.amount?.name === "FeeTooHigh";
  const cryptoCurrency =
    accountCurrency?.type === "TokenCurrency" ? accountCurrency.parentCurrency : accountCurrency;
  const isStellarMultisignBlocked =
    cryptoCurrency?.family === "stellar" && recipientErrorRaw?.name === "StellarSourceHasMultiSign";
  const multisignMessage =
    isStellarMultisignBlocked && recipientError?.title
      ? ({ type: "error", text: recipientError.title } as const)
      : null;
  const baseAmountMessage = getAmountScreenMessage({
    amountErrorTitle,
    amountWarningTitle: amountErrorTitle ? undefined : amountWarningTitle,
    isFeeTooHigh,
    hasRawAmount,
  });
  const fallbackBlockingMessage =
    !multisignMessage && !baseAmountMessage && hasRawAmount && otherBlockingError?.title
      ? ({ type: "error", text: otherBlockingError.title } as const)
      : null;
  const amountMessage = multisignMessage ?? baseAmountMessage ?? fallbackBlockingMessage;

  const hasInsufficientFundsError = useMemo(() => {
    if (!status.errors?.amount) return false;
    const errorName = status.errors.amount.name;
    return (
      errorName === "NotEnoughBalance" ||
      errorName === "NotEnoughBalanceFees" ||
      errorName === "NotEnoughBalanceSwap" ||
      errorName === "NotEnoughBalanceBecauseDestinationNotCreated" ||
      errorName === "NotEnoughBalanceInParentAccount" ||
      errorName === "NotEnoughBalanceToDelegate" ||
      errorName.includes("Insufficient")
    );
  }, [status.errors?.amount]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  // For enabling the CTA, rely on the user-entered transaction amount (no bridge lag)
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) || !hasAmount || amountComputationPending;
  const showNetworkFees = true;

  const selectedFeeStrategy = transaction.feesStrategy ?? null;
  const selectedPresetFiatValue =
    selectedFeeStrategy && selectedFeeStrategy !== "custom"
      ? fiatByPreset[selectedFeeStrategy] ?? null
      : null;

  const onSelectFeeStrategy = useCallback(
    (strategy: string) => {
      const feesStrategy: Transaction["feesStrategy"] =
        strategy === "slow" || strategy === "medium" || strategy === "fast" || strategy === "custom"
          ? strategy
          : null;

      updateTransactionWithPatch({ feesStrategy });
    },
    [updateTransactionWithPatch],
  );

  const reviewLabel = hasInsufficientFundsError
    ? t("newSendFlow.getCta", { currency: accountCurrency?.ticker ?? "CRYPTO" })
    : t("newSendFlow.reviewCta");

  const getFeeStrategyLabel = (strategy: string | null): string => {
    if (!strategy) return t("fees.medium");
    if (strategy === "custom") return t("fees.custom");
    return t(`fees.${strategy}`);
  };

  return {
    amountValue: amountInput.amountValue,
    amountInputMaxDecimalLength: amountInput.amountInputMaxDecimalLength,
    currencyText: amountInput.currencyText,
    currencyPosition: amountInput.currencyPosition,
    isInputDisabled: isStellarMultisignBlocked,
    onAmountChange: amountInput.onAmountChange,
    onToggleInputMode: amountInput.onToggleInputMode,
    toggleLabel: t("newSendFlow.switchInputMode"),
    secondaryValue: amountInput.secondaryValue,
    feesRowLabel: t("fees.networkFees"),
    feesRowValue: selectedPresetFiatValue ?? feeSummary?.fiatValue ?? "--",
    feesRowStrategyLabel: getFeeStrategyLabel(selectedFeeStrategy),
    quickActions,
    showQuickActions: quickActionsAvailableBalance.gt(0),
    amountMessage,
    showNetworkFees,
    reviewLabel,
    reviewShowIcon: !hasInsufficientFundsError,
    reviewDisabled,
    reviewLoading: amountComputationPending,
    showFeePresets: uiConfig.hasFeePresets,
    selectedFeeStrategy,
    onSelectFeeStrategy,
    feePresetOptions,
    fiatByPreset,
    legendByPreset,
  };
}
