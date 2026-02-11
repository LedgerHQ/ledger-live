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
import type { AmountScreenViewModel } from "../types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
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
import { useInitialTransactionPreparation } from "./useInitialTransactionPreparation";
import { useAmountScreenMessage } from "./useAmountScreenMessage";

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
  const { navigation } = useFlowWizard();

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

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => updateTransactionWithPatch({}),
  });

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

  const { amountMessage, isStellarMultisignBlocked } = useAmountScreenMessage({
    status,
    accountCurrency,
    amountComputationPending,
    hasRawAmount,
  });

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

  // Navigate to custom fees step
  const onOpenCustomFees = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.CUSTOM_FEES);
  }, [navigation]);

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
    onOpenCustomFees,
  };
}
