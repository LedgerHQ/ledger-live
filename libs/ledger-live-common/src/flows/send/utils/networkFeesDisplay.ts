import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Unit } from "@domain/entity-currency-unit";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { FeePresetOption } from "../../../bridge/descriptor/types";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import type { Transaction } from "../../../coin-modules/transaction-types";
import { isTokenAccount } from "../../../account/helpers";

export type FeeDisplayContext = Readonly<{
  displayUnit: Unit;
  displayCurrency: CryptoOrTokenCurrency;
}>;

export function resolveFeeDisplayContext(params: {
  mainAccount: Account;
  accountCurrency: CryptoOrTokenCurrency;
  accountUnit: Unit;
  feeCurrencyAccountId?: string | null;
}): FeeDisplayContext {
  const feeCurrencySubAccount = params.feeCurrencyAccountId
    ? ((params.mainAccount.subAccounts ?? []).find(
        (sub): sub is TokenAccount => sub.id === params.feeCurrencyAccountId && isTokenAccount(sub),
      ) ?? null)
    : null;

  return {
    displayUnit: feeCurrencySubAccount?.token.units[0] ?? params.accountUnit,
    displayCurrency: feeCurrencySubAccount?.token ?? params.accountCurrency,
  };
}

function formatFeeAmount(unit: Unit, amount: BigNumber, locale?: string): string {
  return formatCurrencyUnit(unit, amount, {
    showCode: true,
    disableRounding: true,
    ...(locale ? { locale } : {}),
  });
}

export type FormatFeesValueParams = Readonly<{
  estimatedFees: BigNumber;
  estimatedFeesCountervalue: BigNumber | null | undefined;
  fiatUnit: Unit;
  displayUnit: Unit;
  locale?: string;
}>;

export type FormattedFeesValue = Readonly<{
  displayFeesValue: string;
  formattedEstimatedFeesFiat: string | null;
}>;

/**
 * Default fee row value: fiat when a positive countervalue exists, native amount otherwise, `"-"`
 * when the fee is not a positive finite value (zero, negative, or non-finite).
 */
export function formatDisplayFeesValue(params: FormatFeesValueParams): FormattedFeesValue {
  if (!params.estimatedFees.isFinite() || params.estimatedFees.lte(0)) {
    return { displayFeesValue: "-", formattedEstimatedFeesFiat: null };
  }

  const fiatAmount = new BigNumber(params.estimatedFeesCountervalue ?? 0);
  if (fiatAmount.gt(0)) {
    const formattedEstimatedFeesFiat = formatFeeAmount(params.fiatUnit, fiatAmount, params.locale);
    return { displayFeesValue: formattedEstimatedFeesFiat, formattedEstimatedFeesFiat };
  }

  const displayFeesValue = formatFeeAmount(params.displayUnit, params.estimatedFees, params.locale);
  return { displayFeesValue, formattedEstimatedFeesFiat: null };
}

/**
 * Fee row value for coins that opt into `FeeDescriptor.showFeeCurrencyAmount`: the native fee-currency
 * amount shown next to the fiat value (`<fiat> • <amount> <code>`). Fiat is prepended when the fee is
 * zero (0 fiat is accurate) or a positive countervalue exists; with no rate for a non-zero fee the
 * native amount is shown alone rather than implying a zero fiat rate. A non-finite/negative estimate
 * is treated as zero.
 */
export function formatCombinedFeesValue(params: FormatFeesValueParams): FormattedFeesValue {
  const isZeroFee = !params.estimatedFees.isFinite() || params.estimatedFees.lte(0);
  const cryptoAmount = isZeroFee ? new BigNumber(0) : params.estimatedFees;
  const crypto = formatFeeAmount(params.displayUnit, cryptoAmount, params.locale);

  const fiatAmount = isZeroFee
    ? new BigNumber(0)
    : new BigNumber(params.estimatedFeesCountervalue ?? 0);
  if (isZeroFee || fiatAmount.gt(0)) {
    const formattedEstimatedFeesFiat = formatFeeAmount(params.fiatUnit, fiatAmount, params.locale);
    return {
      displayFeesValue: `${formattedEstimatedFeesFiat} • ${crypto}`,
      formattedEstimatedFeesFiat,
    };
  }

  return { displayFeesValue: crypto, formattedEstimatedFeesFiat: null };
}

export function getSelectedPresetFiatValue(
  selectedFeeStrategy: string | null,
  fiatByPreset: Readonly<Record<string, string | null>>,
): string | null {
  if (!selectedFeeStrategy || selectedFeeStrategy === "custom") return null;
  return fiatByPreset[selectedFeeStrategy] ?? null;
}

export type FeePresetEstimationConfig = Readonly<{
  feePresetOptions: readonly FeePresetOption[];
  hasFeePresets: boolean;
  shouldEstimateFeePresets: boolean;
  fallbackPresetIds?: readonly string[];
  allowZeroAmountEstimation: boolean;
}>;

export function getFeePresetEstimationConfig(
  accountCurrency: CryptoOrTokenCurrency,
  transaction: Transaction,
): FeePresetEstimationConfig {
  const feePresetOptions = sendFeatures.getFeePresetOptions(accountCurrency, transaction);
  const hasFeePresets = sendFeatures.hasFeePresets(accountCurrency);
  const shouldEstimateFeePresetsWithBridge = sendFeatures.shouldEstimateFeePresetsWithBridge(
    accountCurrency,
    transaction,
  );
  const fallbackPresetIds = sendFeatures.getFeePresetFallbackIds(accountCurrency, transaction);
  const shouldEstimateFallbackPresetsWithBridge =
    hasFeePresets && feePresetOptions.length === 0 && fallbackPresetIds.length > 0;

  return {
    feePresetOptions,
    hasFeePresets,
    shouldEstimateFeePresets:
      shouldEstimateFeePresetsWithBridge || shouldEstimateFallbackPresetsWithBridge,
    fallbackPresetIds: shouldEstimateFallbackPresetsWithBridge ? fallbackPresetIds : undefined,
    allowZeroAmountEstimation: sendFeatures.canEstimateFeePresetsWithZeroAmount(
      accountCurrency,
      transaction,
    ),
  };
}
