import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { FeeAssetOption } from "@ledgerhq/live-common/bridge/descriptor";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import BigNumber from "bignumber.js";
import { useBridgeFeeEstimation } from "./useBridgeFeeEstimation";
import { useCustomFeeValidation } from "./useCustomFeeValidation";
import {
  isValidNumberForInput,
  getCustomFeeLabelKeyLwd,
  getCustomFeeHelperLabelKeyLwd,
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

type CustomFeesViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
}>;

export function useCustomFeesViewModel({
  account,
  parentAccount,
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
}: CustomFeesViewModelProps): CustomFeesViewModel {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

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
  // Custom fee assets are exposed by descriptor for CELO, but not wired into
  // transaction patching/estimation yet. Keep selector hidden until functional.
  const hasCustomAssetsFlag = false;

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
  // derived directly from the user inputs (EVM: feeRate * gasLimit, or direct fees field).
  const estimatedFeesFromInputs = useMemo(() => {
    if (!customFeeConfig || !allInputsValid) return null;

    const patch = customFeeConfig.buildTransactionPatch(values);

    const directFees = patch["fees"];
    if (BigNumber.isBigNumber(directFees) && directFees.gt(0)) return directFees;

    const feeRate = patch["maxFeePerGas"] ?? patch["gasPrice"];
    // gasLimit is no longer an editable custom fee input, but the estimation formula
    // (feeRate × gasLimit) still needs it. We read it as read-only from the transaction
    // (set by the bridge), falling back through customGasLimit -> gasLimit.
    const txRecord = transaction as Record<string, unknown>;
    let transactionGasLimit: BigNumber | null = null;
    if (BigNumber.isBigNumber(txRecord.customGasLimit)) {
      transactionGasLimit = txRecord.customGasLimit;
    } else if (BigNumber.isBigNumber(txRecord.gasLimit)) {
      transactionGasLimit = txRecord.gasLimit;
    }
    const gasLimit = patch["customGasLimit"] ?? patch["gasLimit"] ?? transactionGasLimit;
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
        error = t("newSendFlow.customFees.invalidValue");
      }

      const minVal = computeMinValue(input, transaction);
      if (minVal && isValidNumberForInput(input.key, value) && new BigNumber(value).lt(minVal)) {
        error = t("newSendFlow.customFees.belowMinimum", { min: minVal });
      }

      if (input.key === "maxFeePerGas" && hasMaxFeeViolation && allInputsValid) {
        error = t("newSendFlow.customFees.maxFeeBelowPriorityFee");
      }

      if (
        input.key === insufficientBalanceTargetInputKey &&
        allInputsValid &&
        !hasMinValueViolation &&
        !hasMaxFeeViolation &&
        hasInsufficientBalance
      ) {
        error = t("newSendFlow.insufficientBalanceFees");
      }

      const suggestedRange = computeSuggestedRange(input, transaction);
      const helperLabelKey = getCustomFeeHelperLabelKeyLwd(input.key);

      return {
        key: input.key,
        label: t(getCustomFeeLabelKeyLwd(input.key), {
          unit: effectiveUnitLabel ?? input.unitLabel,
        }),
        value,
        error,
        suggestedRange,
        helperLabel: input.helperInfo && helperLabelKey ? t(helperLabelKey) : null,
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
    t,
  ]);

  const estimatedFeesCountervalue = useCalculate({
    from: accountCurrency,
    to: counterValueCurrency,
    value: estimatedFeesForValidation.toNumber(),
    disableRounding: true,
  });
  const estimatedFeesFiat = useMemo(
    () => new BigNumber(estimatedFeesCountervalue ?? 0),
    [estimatedFeesCountervalue],
  );

  const fiatLabel = useMemo(() => {
    if (!counterValueCurrency.ticker) return null;
    return t("newSendFlow.customFees.networkFeesInFiat", {
      currency: counterValueCurrency.ticker,
    });
  }, [counterValueCurrency.ticker, t]);

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
    confirmLabel: t("newSendFlow.customFees.confirm"),
    suggestedLabel: t("newSendFlow.customFees.suggested"),
    payFeesInLabel: t("newSendFlow.customFees.payFeesIn"),
  };
}
