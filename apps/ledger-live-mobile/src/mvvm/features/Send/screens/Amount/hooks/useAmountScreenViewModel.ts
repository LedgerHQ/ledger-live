import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation, useLocale } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useAmountInputController } from "./useAmountInputController";
import { useQuickActions } from "./useQuickActions";
import { useFeePresetOptions } from "./useFeePresetOptions";
import { useFeePresetFiatValues } from "./useFeePresetFiatValues";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import {
  getStatusError,
  pickBlockingError,
} from "@ledgerhq/live-common/flows/send/amount/utils/errors";

type FeesStrategy = NonNullable<Transaction["feesStrategy"]>;
const FEES_STRATEGIES = new Set(["slow", "medium", "fast", "custom"]);
const asFeesStrategy = (s: string): FeesStrategy | null =>
  FEES_STRATEGIES.has(s) ? (s as FeesStrategy) : null;

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
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];
  const feePresetOptions = useFeePresetOptions(accountCurrency, transaction);
  const hasFeePresets = uiConfig.hasFeePresets;
  const shouldEstimateFeePresetsWithBridge = sendFeatures.shouldEstimateFeePresetsWithBridge(
    accountCurrency,
    transaction,
  );
  const shouldForceBridgeEstimationForEvm =
    hasFeePresets && transaction.family === "evm" && feePresetOptions.length === 0;
  const shouldEstimateFeePresets =
    shouldEstimateFeePresetsWithBridge || shouldForceBridgeEstimationForEvm;

  const feePresetFiatValues = useFeePresetFiatValues({
    account,
    parentAccount,
    mainAccount,
    transaction,
    feePresetOptions,
    fallbackPresetIds: shouldForceBridgeEstimationForEvm ? ["slow", "medium", "fast"] : undefined,
    counterValueCurrency,
    fiatUnit,
    locale,
    enabled: hasFeePresets,
    shouldEstimateWithBridge: shouldEstimateFeePresets,
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

  const amountInput = useAmountInputController({
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

  const maxAvailable = useMemo(() => {
    if (!account) return new BigNumber(0);
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = spendable ?? account.balance ?? new BigNumber(0);

    const estimatedFees = status.estimatedFees ?? new BigNumber(0);
    const safeMax = balance.minus(estimatedFees);

    return BigNumber.max(0, safeMax);
  }, [account, status.estimatedFees]);

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

  // Message logic
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

  const hasInsufficientFundsError = useMemo(() => {
    if (!status.errors?.amount) return false;
    const errorName = status.errors.amount.name;
    return errorName.startsWith("NotEnough") || errorName.includes("Insufficient");
  }, [status.errors?.amount]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) ||
    !hasAmount ||
    amountComputationPending ||
    amountInput.isTyping;

  const selectedFeeStrategy = transaction.feesStrategy ?? null;

  const onSelectFeeStrategy = useCallback(
    (strategy: string) => {
      updateTransactionWithPatch({ feesStrategy: asFeesStrategy(strategy) });
    },
    [updateTransactionWithPatch],
  );

  const reviewLabel = useMemo(
    () =>
      hasInsufficientFundsError
        ? t("send.newSendFlow.getCta", { currency: accountCurrency?.ticker ?? "CRYPTO" })
        : t("send.newSendFlow.reviewCta"),
    [hasInsufficientFundsError, t, accountCurrency],
  );

  const getFeeStrategyLabel = useCallback(
    (strategy: string | null): string => {
      const s = asFeesStrategy(strategy ?? "medium");
      return t(`send.fees.${s}`);
    },
    [t],
  );

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );

  const estimatedFeesCountervalue = useCalculate({
    from: accountCurrency,
    to: counterValueCurrency,
    value: estimatedFees.toNumber(),
    disableRounding: true,
  });

  const feesValue = useMemo(() => {
    if (estimatedFees.lte(0)) return "-";

    const fiatAmount = new BigNumber(estimatedFeesCountervalue ?? 0);
    if (fiatAmount.gt(0)) {
      return formatCurrencyUnit(fiatUnit, fiatAmount, {
        showCode: true,
        disableRounding: true,
        locale,
      });
    }

    // Fallback to crypto if no countervalue
    return formatCurrencyUnit(accountUnit, estimatedFees, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [estimatedFees, estimatedFeesCountervalue, fiatUnit, accountUnit, locale]);

  const feePresetOptionsMapped = useMemo(() => {
    const mapped = feePresetOptions.map(opt => {
      return {
        id: opt.id,
        label: t(`send.fees.${opt.id}`),
        fiatValue: feePresetFiatValues[opt.id] ?? null,
        legendValue: null,
      };
    });
    return mapped;
  }, [feePresetOptions, t, feePresetFiatValues]);

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
      networkFees: {
        label: t("send.fees.title"),
        value: feesValue,
        strategyLabel: getFeeStrategyLabel(selectedFeeStrategy),
        showFeePresets: uiConfig.hasFeePresets,
        selectedFeeStrategy,
        feePresetOptions: feePresetOptionsMapped,
        onSelectFeeStrategy,
        uiConfig: {
          hasCustomFees: uiConfig.hasCustomFees,
          hasCoinControl: uiConfig.hasCoinControl,
        },
      },
      quickActions: {
        actions: quickActions,
        show: mainAccount.balance.gt(0),
      },
      reviewButton: {
        label: reviewLabel,
        showIcon: !hasInsufficientFundsError,
        disabled: reviewDisabled,
        loading: amountComputationPending,
        onPress: hasInsufficientFundsError ? onGetFunds : onReview,
      },
      message: amountMessage,
    }),
    [
      amountInput,
      isStellarMultisignBlocked,
      t,
      feesValue,
      getFeeStrategyLabel,
      selectedFeeStrategy,
      uiConfig.hasFeePresets,
      uiConfig.hasCustomFees,
      uiConfig.hasCoinControl,
      feePresetOptionsMapped,
      onSelectFeeStrategy,
      quickActions,
      mainAccount.balance,
      reviewLabel,
      hasInsufficientFundsError,
      reviewDisabled,
      amountComputationPending,
      onGetFunds,
      onReview,
      amountMessage,
    ],
  );
}
