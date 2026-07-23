import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Currency, CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency, getMainAccount } from "../../../../account";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import type {
  CustomFeeInputValueTransform,
  FeeAssetContext,
  FeeAssetOption,
} from "../../../../bridge/descriptor/types";
import { resolveFeeUnitLabel, sendFeatures } from "../../../../bridge/descriptor/send/features";
import type { SendFlowTransactionActions } from "../../types";
import { useBridgeFeeEstimation } from "./useBridgeFeeEstimation";
import { useCustomFeeValidation } from "./useCustomFeeValidation";
import {
  isValidNumberForInput,
  computeSuggestedRange,
  computeMinValue,
  normalizeDecimalSeparator,
} from "../utils/customFeeUtils";
import { resolveFeeDisplayContext } from "../../utils/networkFeesDisplay";

export type CustomFeeInputState = Readonly<{
  key: string;
  label: string;
  value: string;
  error: string | null;
  suggestedRange: { min: string; max: string } | null;
  helperLabel: string | null;
  helperValue: string | null;
}>;

/** A `FeeAssetOption` enriched with a locale-formatted balance for display. */
export type FeeAssetUiOption = Readonly<FeeAssetOption & { formattedBalance?: string }>;

export type CustomFeesViewModel = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
  hasCustomAssets: boolean;
  assetOptions: readonly FeeAssetUiOption[];
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
  discreet: boolean;
  counterValueCurrency: Currency;
  /** Reactive countervalue calculator (e.g. from useCalculateCountervalueCallback). */
  calculateCountervalue: (from: Currency, value: BigNumber) => BigNumber | null | undefined;
  labels: CustomFeesViewModelLabels;
}>;

function shouldTransformInput(key: string, transform: CustomFeeInputValueTransform): boolean {
  return transform.inputKeys === undefined || transform.inputKeys.includes(key);
}

function transformInputValues(
  values: Record<string, string>,
  transform: CustomFeeInputValueTransform | null,
  direction: "fromCanonical" | "toCanonical",
): Record<string, string> {
  if (!transform) return values;

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (!shouldTransformInput(key, transform)) return [key, value];
      return [
        key,
        direction === "fromCanonical"
          ? transform.fromCanonicalValue(value)
          : transform.toCanonicalValue(value),
      ];
    }),
  );
}

function transformInputValue(
  key: string,
  value: string,
  transform: CustomFeeInputValueTransform | null,
  direction: "fromCanonical" | "toCanonical",
): string {
  if (!transform || !shouldTransformInput(key, transform)) return value;
  return direction === "fromCanonical"
    ? transform.fromCanonicalValue(value)
    : transform.toCanonicalValue(value);
}

export function useCustomFeesViewModelCore({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
  locale,
  discreet,
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

  const feeAssetContext = useMemo<FeeAssetContext>(
    () => ({ mainAccount, transaction }),
    [mainAccount, transaction],
  );

  // The coin-module owns the options, the selected value and the resulting patch.
  // This view model only renders the "Pay fees in" select and forwards the choice.
  // The raw `balance` is formatted here (locale-aware); the descriptor stays locale-blind.
  const assetOptions = useMemo<readonly FeeAssetUiOption[]>(() => {
    const options = customAssetsConfig?.getOptions(feeAssetContext) ?? [];
    return options.map(option => ({
      ...option,
      formattedBalance:
        option.balance !== undefined && option.currency
          ? formatCurrencyUnit(option.currency.units[0], option.balance, {
              showCode: false,
              disableRounding: true,
              discreet,
              locale,
            })
          : undefined,
    }));
  }, [customAssetsConfig, feeAssetContext, locale, discreet]);
  const hasCustomAssetsFlag = assetOptions.length > 0;

  const selectedAssetId = useMemo(
    () => customAssetsConfig?.getSelectedOptionId(feeAssetContext) ?? "",
    [customAssetsConfig, feeAssetContext],
  );

  const onAssetChange = useCallback(
    (id: string) => {
      const patch = customAssetsConfig?.buildPatch(id, feeAssetContext);
      if (!patch) return;
      transactionActions.updateTransaction(tx => ({ ...tx, ...patch }) as Transaction);
    },
    [customAssetsConfig, feeAssetContext, transactionActions],
  );

  // Let the coin-module reset an invalid fee asset selection (e.g. the selected
  // token sub-account vanished). Reconciliation logic stays in the descriptor.
  useEffect(() => {
    const patch = customAssetsConfig?.reconcile?.(feeAssetContext);
    if (!patch) return;
    transactionActions.updateTransaction(tx => ({ ...tx, ...patch }) as Transaction);
  }, [customAssetsConfig, feeAssetContext, transactionActions]);

  const selectedAsset = useMemo(
    () => assetOptions.find(o => o.id === selectedAssetId),
    [assetOptions, selectedAssetId],
  );

  const selectedInputValueTransform = selectedAsset?.customFeeInputValueTransform ?? null;
  const selectedInputValueTransformId = selectedInputValueTransform ? selectedAssetId : null;
  const feeCurrencyAccountId = sendFeatures.getFeeCurrencyAccountId(accountCurrency, transaction);
  const { displayCurrency } = useMemo(
    () =>
      resolveFeeDisplayContext({
        mainAccount,
        accountCurrency,
        accountUnit: accountCurrency.units[0],
        feeCurrencyAccountId,
      }),
    [accountCurrency, feeCurrencyAccountId, mainAccount],
  );

  // When hasCustomAssets, the unit label comes from the selected asset (eg. "Gwei" for CELO)
  const effectiveUnitLabel = useMemo(() => {
    if (!hasCustomAssetsFlag) return null;
    return selectedAsset?.unitLabel ?? selectedAsset?.ticker ?? null;
  }, [hasCustomAssetsFlag, selectedAsset]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!customFeeConfig) return {};
    return transformInputValues(
      customFeeConfig.getInitialValues(transaction),
      selectedInputValueTransform,
      "fromCanonical",
    );
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const previousInputValueTransformRef = useRef<CustomFeeInputValueTransform | null>(
    selectedInputValueTransform,
  );
  const previousInputValueTransformIdRef = useRef<string | null>(selectedInputValueTransformId);

  useEffect(() => {
    if (previousInputValueTransformIdRef.current === selectedInputValueTransformId) return;

    const previousTransform = previousInputValueTransformRef.current;
    setValues(prev =>
      transformInputValues(
        transformInputValues(prev, previousTransform, "toCanonical"),
        selectedInputValueTransform,
        "fromCanonical",
      ),
    );
    previousInputValueTransformRef.current = selectedInputValueTransform;
    previousInputValueTransformIdRef.current = selectedInputValueTransformId;
  }, [selectedInputValueTransform, selectedInputValueTransformId]);

  const activeInputs = useMemo(() => {
    if (!customFeeConfig) return [];
    return customFeeConfig.inputs.filter(input => input.key in values);
  }, [customFeeConfig, values]);

  const canonicalValues = useMemo(
    () => transformInputValues(values, selectedInputValueTransform, "toCanonical"),
    [selectedInputValueTransform, values],
  );

  const onInputChange = useCallback((key: string, value: string) => {
    const normalized = normalizeDecimalSeparator(value);
    setValues(prev => ({ ...prev, [key]: normalized }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const onInputClear = useCallback((key: string) => {
    setValues(prev => ({ ...prev, [key]: "" }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const allInputsValid = useMemo(
    () =>
      Boolean(customFeeConfig) &&
      activeInputs.every(input =>
        isValidNumberForInput(input.key, canonicalValues[input.key] ?? ""),
      ),
    [customFeeConfig, activeInputs, canonicalValues],
  );

  // Local fee estimation shortcut — avoids a bridge round-trip when fees can be
  // derived directly from the user inputs using the transaction gas limit.
  const estimatedFeesFromInputs = useMemo(() => {
    if (!customFeeConfig || !allInputsValid || selectedInputValueTransform) return null;

    const patch = customFeeConfig.buildTransactionPatch(canonicalValues);

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
  }, [allInputsValid, canonicalValues, customFeeConfig, selectedInputValueTransform, transaction]);

  const { estimatedFeesFromBridge, bridgeHasInsufficientBalance, bridgeEstimationKey } =
    useBridgeFeeEstimation({
      account,
      parentAccount,
      transaction,
      values: canonicalValues,
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
    values: canonicalValues,
    estimatedFeesForValidation,
    bridgeHasInsufficientBalance,
    hasCustomFeeConfig: Boolean(customFeeConfig),
  });

  const inputStates: CustomFeeInputState[] = useMemo(() => {
    if (!customFeeConfig) return [];

    return activeInputs.map(input => {
      const value = values[input.key] ?? "";
      const canonicalValue = canonicalValues[input.key] ?? "";
      const isTouched = touched[input.key] ?? false;

      let error: string | null = null;

      if (
        isTouched &&
        canonicalValue.trim() !== "" &&
        !isValidNumberForInput(input.key, canonicalValue)
      ) {
        error = labels.invalidValue;
      }

      const minVal = computeMinValue(input, transaction);
      if (
        minVal &&
        isValidNumberForInput(input.key, canonicalValue) &&
        new BigNumber(canonicalValue).lt(minVal)
      ) {
        error = labels.belowMinimum(
          transformInputValue(input.key, minVal, selectedInputValueTransform, "fromCanonical"),
        );
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
      const displaySuggestedRange = suggestedRange
        ? {
            min: transformInputValue(
              input.key,
              suggestedRange.min,
              selectedInputValueTransform,
              "fromCanonical",
            ),
            max: transformInputValue(
              input.key,
              suggestedRange.max,
              selectedInputValueTransform,
              "fromCanonical",
            ),
          }
        : null;

      return {
        key: input.key,
        label: labels.getInputLabel(
          input.key,
          effectiveUnitLabel ?? resolveFeeUnitLabel(input.unitLabel, currency),
        ),
        value,
        error,
        suggestedRange: displaySuggestedRange,
        helperLabel: input.helperInfo ? labels.getHelperLabel(input.key) : null,
        helperValue: input.helperInfo ? input.helperInfo.getValue(transaction) : null,
      };
    });
  }, [
    customFeeConfig,
    activeInputs,
    transaction,
    values,
    canonicalValues,
    touched,
    allInputsValid,
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    insufficientBalanceTargetInputKey,
    effectiveUnitLabel,
    selectedInputValueTransform,
    currency,
    labels,
  ]);

  const estimatedFeesCountervalue = useMemo(
    () => calculateCountervalue(displayCurrency, estimatedFeesForValidation),
    [calculateCountervalue, displayCurrency, estimatedFeesForValidation],
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

    const patch = customFeeConfig.buildTransactionPatch(canonicalValues);
    transactionActions.updateTransaction(tx => ({
      ...tx,
      ...patch,
      // In max mode, amount is derived from balance - fees.
      // Reset to 0 to force bridge/status recomputation with the newly confirmed custom fees.
      ...(tx.useAllAmount ? { amount: new BigNumber(0) } : {}),
    }));
    onConfirm();
  }, [canonicalValues, customFeeConfig, isConfirmDisabled, transactionActions, onConfirm]);

  return {
    inputs: inputStates,
    fiatLabel,
    fiatValue,
    isConfirmDisabled,
    onInputChange,
    onInputClear,
    onConfirm: handleConfirm,
    hasCustomAssets: hasCustomAssetsFlag,
    assetOptions,
    selectedAssetId,
    onAssetChange,
    confirmLabel: labels.confirm,
    suggestedLabel: labels.suggested,
    payFeesInLabel: labels.payFeesIn,
  };
}
