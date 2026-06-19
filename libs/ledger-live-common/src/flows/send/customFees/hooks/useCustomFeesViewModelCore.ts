import { useState, useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Currency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import type { FeeAssetOption } from "../../../../bridge/descriptor/types";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import type { SendFlowTransactionActions } from "../../types";
import { useBridgeFeeEstimation } from "./useBridgeFeeEstimation";
import { useCustomFeeValidation } from "./useCustomFeeValidation";
import {
  isValidNumberForInput,
  computeSuggestedRange,
  computeMinValue,
} from "../utils/customFeeUtils";

export type CustomFeeInputState = Readonly<{
  key: string;
  label: string;
  value: string;
  error: string | null;
  suggestedRange: { min: string; max: string } | null;
  helperLabel: string | null;
  helperValue: string | null;
}>;

export type CustomFeesViewModel = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
  hasCustomAssets: boolean;
  assetOptions: readonly FeeAssetOption[];
  selectedAssetId: string;
  onAssetChange: (id: string) => void;
  confirmLabel: string;
  suggestedLabel: string;
  payFeesInLabel: string;
}>;

/**
 * Platform-agnostic labels for the custom fees view model.
 * The app layer resolves them through its own i18n namespace and selectors.
 */
export type CustomFeesViewModelLabels = Readonly<{
  /** Resolves the input label for a given input key and unit (e.g. "Max fee (Gwei)"). */
  getInputLabel: (inputKey: string, unit: string | undefined) => string;
  /** Resolves the helper label for a given input key, or null when none (e.g. "Next block"). */
  getHelperLabel: (inputKey: string) => string | null;
  /** Resolves the fiat row label (e.g. "Network fees in USD"). */
  getNetworkFeesInFiatLabel: (currencyTicker: string) => string;
  invalidValue: string;
  belowMinimum: (min: string) => string;
  maxFeeBelowPriorityFee: string;
  insufficientBalanceFees: string;
  confirm: string;
  suggested: string;
  payFeesIn: string;
}>;

export type UseCustomFeesViewModelCoreParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
  locale: string;
  counterValueCurrency: Currency;
  /** Reactive countervalue calculator (e.g. from useCalculateCountervalueCallback). */
  calculateCountervalue: (from: Currency, value: BigNumber) => BigNumber | null | undefined;
  labels: CustomFeesViewModelLabels;
}>;

export function useCustomFeesViewModelCore({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
  locale,
  counterValueCurrency,
  calculateCountervalue,
  labels,
}: UseCustomFeesViewModelCoreParams): CustomFeesViewModel {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const fiatUnit = counterValueCurrency.units[0];

  const customFeeConfig = useMemo(() => sendFeatures.getCustomFeeConfig(currency), [currency]);
  const customAssetsConfig = useMemo(
    () => sendFeatures.getCustomAssetsConfig(currency),
    [currency],
  );
  const hasCustomAssetsFlag = Boolean(customAssetsConfig?.options.length);

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    () => customAssetsConfig?.defaultId ?? "",
  );
  const onAssetChange = useCallback((id: string) => setSelectedAssetId(id), []);

  // When hasCustomAssets, the unit label comes from the selected asset (eg. "Gwei" for CELO)
  const effectiveUnitLabel = useMemo(() => {
    if (!hasCustomAssetsFlag || !customAssetsConfig) return null;
    const selectedAsset = customAssetsConfig.options.find(o => o.id === selectedAssetId);
    return selectedAsset?.unitLabel ?? selectedAsset?.ticker ?? null;
  }, [hasCustomAssetsFlag, customAssetsConfig, selectedAssetId]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!customFeeConfig) return {};
    return customFeeConfig.getInitialValues(transaction);
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const activeInputs = useMemo(() => {
    if (!customFeeConfig) return [];
    return customFeeConfig.inputs.filter(input => input.key in values);
  }, [customFeeConfig, values]);

  const onInputChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const onInputClear = useCallback((key: string) => {
    setValues(prev => ({ ...prev, [key]: "" }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const allInputsValid = useMemo(
    () =>
      Boolean(customFeeConfig) &&
      activeInputs.every(input => isValidNumberForInput(input.key, values[input.key] ?? "")),
    [customFeeConfig, activeInputs, values],
  );

  // Local fee estimation shortcut — avoids a bridge round-trip when fees can be
  // derived directly from the user inputs using the transaction gas limit.
  const estimatedFeesFromInputs = useMemo(() => {
    if (!customFeeConfig || !allInputsValid) return null;

    const patch = customFeeConfig.buildTransactionPatch(values);

    const directFees = patch["fees"];
    if (BigNumber.isBigNumber(directFees) && directFees.gt(0)) return directFees;

    const feeRate = patch["maxFeePerGas"] ?? patch["gasPrice"];
    const customGasLimitValue = Reflect.get(transaction, "customGasLimit");
    const customGasLimit = BigNumber.isBigNumber(customGasLimitValue) ? customGasLimitValue : null;
    const gasLimitValue = Reflect.get(transaction, "gasLimit");
    const gasLimit =
      customGasLimit ?? (BigNumber.isBigNumber(gasLimitValue) ? gasLimitValue : null);
    if (BigNumber.isBigNumber(feeRate) && BigNumber.isBigNumber(gasLimit)) {
      const localFees = feeRate.times(gasLimit);
      if (localFees.gt(0)) return localFees;
    }

    return null;
  }, [allInputsValid, customFeeConfig, transaction, values]);

  const { estimatedFeesFromBridge, bridgeHasInsufficientBalance, bridgeEstimationKey } =
    useBridgeFeeEstimation({
      account,
      parentAccount,
      transaction,
      values,
      allInputsValid,
      estimatedFeesFromInputs,
      customFeeConfig: customFeeConfig ?? null,
    });

  const estimatedFeesForValidation = useMemo(() => {
    if (estimatedFeesFromInputs) return estimatedFeesFromInputs;
    if (bridgeEstimationKey && estimatedFeesFromBridge) return estimatedFeesFromBridge;
    return status.estimatedFees ?? new BigNumber(0);
  }, [bridgeEstimationKey, estimatedFeesFromInputs, estimatedFeesFromBridge, status.estimatedFees]);

  const {
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    insufficientBalanceTargetInputKey,
  } = useCustomFeeValidation({
    account,
    transaction,
    status,
    activeInputs,
    values,
    estimatedFeesForValidation,
    bridgeHasInsufficientBalance,
    hasCustomFeeConfig: Boolean(customFeeConfig),
  });

  const inputStates: CustomFeeInputState[] = useMemo(() => {
    if (!customFeeConfig) return [];

    return activeInputs.map(input => {
      const value = values[input.key] ?? "";
      const isTouched = touched[input.key] ?? false;

      let error: string | null = null;

      if (isTouched && value.trim() !== "" && !isValidNumberForInput(input.key, value)) {
        error = labels.invalidValue;
      }

      const minVal = computeMinValue(input, transaction);
      if (minVal && isValidNumberForInput(input.key, value) && new BigNumber(value).lt(minVal)) {
        error = labels.belowMinimum(minVal);
      }

      if (input.key === "maxFeePerGas" && hasMaxFeeViolation && allInputsValid) {
        error = labels.maxFeeBelowPriorityFee;
      }

      if (
        input.key === insufficientBalanceTargetInputKey &&
        allInputsValid &&
        !hasMinValueViolation &&
        !hasMaxFeeViolation &&
        hasInsufficientBalance
      ) {
        error = labels.insufficientBalanceFees;
      }

      const suggestedRange = computeSuggestedRange(input, transaction);

      return {
        key: input.key,
        label: labels.getInputLabel(input.key, effectiveUnitLabel ?? input.unitLabel),
        value,
        error,
        suggestedRange,
        helperLabel: input.helperInfo ? labels.getHelperLabel(input.key) : null,
        helperValue: input.helperInfo ? input.helperInfo.getValue(transaction) : null,
      };
    });
  }, [
    customFeeConfig,
    activeInputs,
    transaction,
    values,
    touched,
    allInputsValid,
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    insufficientBalanceTargetInputKey,
    effectiveUnitLabel,
    labels,
  ]);

  const estimatedFeesCountervalue = useMemo(
    () => calculateCountervalue(accountCurrency, estimatedFeesForValidation),
    [calculateCountervalue, accountCurrency, estimatedFeesForValidation],
  );
  const estimatedFeesFiat = useMemo(
    () => new BigNumber(estimatedFeesCountervalue ?? 0),
    [estimatedFeesCountervalue],
  );

  const fiatLabel = useMemo(() => {
    if (!counterValueCurrency.ticker) return null;
    return labels.getNetworkFeesInFiatLabel(counterValueCurrency.ticker);
  }, [counterValueCurrency.ticker, labels]);

  const fiatValue = useMemo(() => {
    if (bridgeEstimationKey && estimatedFeesForValidation.lte(0)) return null;
    return formatCurrencyUnit(fiatUnit, estimatedFeesFiat, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [bridgeEstimationKey, estimatedFeesForValidation, estimatedFeesFiat, fiatUnit, locale]);

  const isConfirmDisabled =
    !allInputsValid || hasMinValueViolation || hasMaxFeeViolation || hasInsufficientBalance;

  const handleConfirm = useCallback(() => {
    if (!customFeeConfig || isConfirmDisabled) return;

    const patch = customFeeConfig.buildTransactionPatch(values);
    transactionActions.updateTransaction(tx => ({
      ...tx,
      ...patch,
      // In max mode, amount is derived from balance - fees.
      // Reset to 0 to force bridge/status recomputation with the newly confirmed custom fees.
      ...(tx.useAllAmount ? { amount: new BigNumber(0) } : {}),
    }));
    onConfirm();
  }, [customFeeConfig, isConfirmDisabled, values, transactionActions, onConfirm]);

  return {
    inputs: inputStates,
    fiatLabel,
    fiatValue,
    isConfirmDisabled,
    onInputChange,
    onInputClear,
    onConfirm: handleConfirm,
    hasCustomAssets: hasCustomAssetsFlag,
    assetOptions: customAssetsConfig?.options ?? [],
    selectedAssetId,
    onAssetChange,
    confirmLabel: labels.confirm,
    suggestedLabel: labels.suggested,
    payFeesInLabel: labels.payFeesIn,
  };
}
