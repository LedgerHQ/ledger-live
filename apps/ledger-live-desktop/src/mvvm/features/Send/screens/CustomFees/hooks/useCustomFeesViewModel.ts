import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  CustomFeeInputDescriptor,
  FeeAssetOption,
} from "@ledgerhq/live-common/bridge/descriptor";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import BigNumber from "bignumber.js";

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
  onBack: () => void;
}>;

function isValidNumberForInput(inputKey: string, value: string): boolean {
  if (!value.trim()) return false;

  const num = new BigNumber(value);
  if (num.isNaN() || num.isNegative()) return false;

  // EVM max priority fee can be 0.
  if (inputKey === "maxPriorityFeePerGas") {
    return num.gte(0);
  }

  return num.gt(0);
}

function getCustomFeeLabelKeyLwd(inputKey: string): string {
  switch (inputKey) {
    case "maxFeePerGas":
      return "newSendFlow.customFees.maxFee";
    case "maxPriorityFeePerGas":
      return "newSendFlow.customFees.maxPriorityFee";
    case "gasLimit":
      return "newSendFlow.customFees.gasLimit";
    case "gasPrice":
      return "newSendFlow.customFees.feesAmount";
    case "fees":
      return "newSendFlow.customFees.feesAmount";
    case "feePerByte":
      return "newSendFlow.customFees.feePerByte";
    default:
      return "newSendFlow.customFees.feePerByte";
  }
}

function getCustomFeeHelperLabelKeyLwd(inputKey: string): string | null {
  if (inputKey === "maxFeePerGas") return "newSendFlow.customFees.nextBlock";
  return null;
}

function computeSuggestedRange(
  input: CustomFeeInputDescriptor,
  transaction: Transaction,
): { min: string; max: string } | null {
  const getRange = input.suggestedRange?.getRange;
  if (!getRange) return null;

  const range = getRange(transaction);
  if (!range) return null;

  return {
    min: new BigNumber(range.min).toFixed(),
    max: new BigNumber(range.max).toFixed(),
  };
}

function computeMinValue(input: CustomFeeInputDescriptor, transaction: Transaction): string | null {
  const getValue = input.minValue?.getValue;
  if (!getValue) return null;
  return getValue(transaction) ?? null;
}

function getInsufficientBalanceTargetInputKey(
  inputs: readonly CustomFeeInputDescriptor[],
): string | null {
  if (inputs.some(input => input.key === "maxFeePerGas")) return "maxFeePerGas";
  if (inputs.some(input => input.key === "fees")) return "fees";
  if (inputs.some(input => input.key === "feePerByte")) return "feePerByte";
  return inputs[0]?.key ?? null;
}

function hasInsufficientBalanceErrorName(value: unknown): boolean {
  if (!value || typeof value !== "object" || !("name" in value)) return false;
  const maybeName = Reflect.get(value, "name");
  const errorName = typeof maybeName === "string" ? maybeName : "";
  return errorName.includes("Insufficient") || errorName.includes("NotEnoughBalance");
}

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

  const customFeeConfig = useMemo(() => {
    return sendFeatures.getCustomFeeConfig(currency);
  }, [currency]);

  const customAssetsConfig = useMemo(() => {
    return sendFeatures.getCustomAssetsConfig(currency);
  }, [currency]);

  const hasCustomAssetsFlag = sendFeatures.hasCustomAssets(currency);

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    () => customAssetsConfig?.defaultId ?? "",
  );

  const onAssetChange = useCallback((id: string) => {
    setSelectedAssetId(id);
  }, []);

  // When hasCustomAssets, the unit label comes from the selected asset (e.g. "Gwei" for CELO, "cUSD" for cUSD)
  // Cast needed: `unitLabel` is added in live-common source but may not reflect in compiled types yet.
  const effectiveUnitLabel = useMemo(() => {
    if (!hasCustomAssetsFlag || !customAssetsConfig) return null;
    const selectedAsset = customAssetsConfig.options.find(o => o.id === selectedAssetId);
    return selectedAsset?.unitLabel ?? selectedAsset?.ticker ?? null;
  }, [hasCustomAssetsFlag, customAssetsConfig, selectedAssetId]);

  // Local state for input values
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!customFeeConfig) return {};
    return customFeeConfig.getInitialValues(transaction);
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const activeInputs = useMemo(() => {
    if (!customFeeConfig) return [];
    return customFeeConfig.inputs.filter(input => input.key in values);
  }, [customFeeConfig, values]);

  // Input handlers
  const onInputChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const onInputClear = useCallback((key: string) => {
    setValues(prev => ({ ...prev, [key]: "" }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  // Validation
  const allInputsValid = useMemo(() => {
    if (!customFeeConfig) return false;
    return activeInputs.every(input => isValidNumberForInput(input.key, values[input.key] ?? ""));
  }, [customFeeConfig, activeInputs, values]);

  const hasMinValueViolation = useMemo(() => {
    if (!customFeeConfig) return false;
    return activeInputs.some(input => {
      const minVal = computeMinValue(input, transaction);
      if (!minVal) return false;
      const value = values[input.key] ?? "";
      if (!isValidNumberForInput(input.key, value)) return false;
      return new BigNumber(value).lt(new BigNumber(minVal));
    });
  }, [customFeeConfig, activeInputs, values, transaction]);

  // EVM EIP-1559 validation: maxFeePerGas must be >= maxPriorityFeePerGas
  const hasMaxFeeViolation = useMemo(() => {
    const maxFeeValue = values["maxFeePerGas"];
    const maxPriorityFeeValue = values["maxPriorityFeePerGas"];

    if (!maxFeeValue || !maxPriorityFeeValue) return false;
    if (
      !isValidNumberForInput("maxFeePerGas", maxFeeValue) ||
      !isValidNumberForInput("maxPriorityFeePerGas", maxPriorityFeeValue)
    ) {
      return false;
    }

    const maxFee = new BigNumber(maxFeeValue);
    const maxPriorityFee = new BigNumber(maxPriorityFeeValue);

    return maxFee.lt(maxPriorityFee);
  }, [values]);

  const estimatedFeesForValidation = useMemo(() => {
    if (customFeeConfig && allInputsValid) {
      const patch = customFeeConfig.buildTransactionPatch(values);

      // Direct fees value from patch (e.g. Celo computes fees = maxFeePerGas * gasLimit)
      const directFees = patch["fees"];
      if (BigNumber.isBigNumber(directFees) && directFees.gt(0)) {
        return directFees;
      }

      const feeRate = patch["maxFeePerGas"] ?? patch["gasPrice"];
      const gasLimit = patch["customGasLimit"] ?? patch["gasLimit"];
      if (BigNumber.isBigNumber(feeRate) && BigNumber.isBigNumber(gasLimit)) {
        const localFees = feeRate.times(gasLimit);
        if (localFees.gt(0)) return localFees;
      }
    }
    return status.estimatedFees ?? new BigNumber(0);
  }, [customFeeConfig, values, allInputsValid, status.estimatedFees]);

  const hasInsufficientBalance = useMemo(() => {
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    const availableBalance = spendable ?? balance ?? new BigNumber(0);
    const txAmount = transaction.amount ?? new BigNumber(0);
    const totalCost = txAmount.plus(estimatedFeesForValidation);
    const exceedsSpendable = totalCost.gt(availableBalance);
    const fromStatus = Object.entries(status.errors ?? {}).some(
      ([key, error]) => key === "insufficientBalanceFees" || hasInsufficientBalanceErrorName(error),
    );
    return exceedsSpendable || fromStatus;
  }, [account, transaction.amount, estimatedFeesForValidation, status.errors]);

  const insufficientBalanceTargetInputKey = useMemo(() => {
    if (!customFeeConfig) return null;
    return getInsufficientBalanceTargetInputKey(activeInputs);
  }, [customFeeConfig, activeInputs]);

  // Map inputs to state
  const inputStates: CustomFeeInputState[] = useMemo(() => {
    if (!customFeeConfig) return [];

    return activeInputs.map(input => {
      const value = values[input.key] ?? "";
      const isTouched = touched[input.key] ?? false;

      let error: string | null = null;

      if (isTouched && value.trim() !== "" && !isValidNumberForInput(input.key, value)) {
        error = t("newSendFlow.customFees.invalidValue");
      }

      // Min value validation (e.g. gas limit cannot be lower than system estimate)
      const minVal = computeMinValue(input, transaction);
      if (
        minVal &&
        isValidNumberForInput(input.key, value) &&
        new BigNumber(value).lt(new BigNumber(minVal))
      ) {
        error = t("newSendFlow.customFees.belowMinimum", { min: minVal });
      }

      // EVM EIP-1559: maxFeePerGas must be >= maxPriorityFeePerGas
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

  // Fiat value: compute locally from user inputs for live updates
  const estimatedFees = estimatedFeesForValidation;

  const estimatedFeesCountervalue = useCalculate({
    from: accountCurrency,
    to: counterValueCurrency,
    value: estimatedFees.toNumber(),
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
    if (estimatedFees.lte(0) && estimatedFeesFiat.lte(0)) return null;
    return formatCurrencyUnit(fiatUnit, estimatedFeesFiat, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [estimatedFees, estimatedFeesFiat, fiatUnit, locale]);

  const isConfirmDisabled =
    !allInputsValid || hasMinValueViolation || hasMaxFeeViolation || hasInsufficientBalance;

  const handleConfirm = useCallback(() => {
    if (
      !customFeeConfig ||
      !allInputsValid ||
      hasMinValueViolation ||
      hasMaxFeeViolation ||
      hasInsufficientBalance
    ) {
      return;
    }

    const patch = customFeeConfig.buildTransactionPatch(values);
    transactionActions.updateTransaction(tx => ({
      ...tx,
      ...patch,
    }));

    onConfirm();
  }, [
    customFeeConfig,
    allInputsValid,
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    values,
    transactionActions,
    onConfirm,
  ]);

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
