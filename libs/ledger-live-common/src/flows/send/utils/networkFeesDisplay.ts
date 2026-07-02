import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency, Unit } from "@ledgerhq/types-cryptoassets";
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

export function formatDisplayFeesValue(params: {
  estimatedFees: BigNumber;
  estimatedFeesCountervalue: BigNumber | null | undefined;
  fiatUnit: Unit;
  displayUnit: Unit;
  locale?: string;
}): Readonly<{
  displayFeesValue: string;
  formattedEstimatedFeesFiat: string | null;
}> {
  const formatOptions = {
    showCode: true,
    disableRounding: true,
    ...(params.locale ? { locale: params.locale } : {}),
  };

  if (params.estimatedFees.lte(0)) {
    return { displayFeesValue: "-", formattedEstimatedFeesFiat: null };
  }

  const fiatAmount = new BigNumber(params.estimatedFeesCountervalue ?? 0);
  if (fiatAmount.gt(0)) {
    const formattedEstimatedFeesFiat = formatCurrencyUnit(
      params.fiatUnit,
      fiatAmount,
      formatOptions,
    );
    return { displayFeesValue: formattedEstimatedFeesFiat, formattedEstimatedFeesFiat };
  }

  const displayFeesValue = formatCurrencyUnit(
    params.displayUnit,
    params.estimatedFees,
    formatOptions,
  );
  return { displayFeesValue, formattedEstimatedFeesFiat: null };
}

/**
 * Rescale an estimated fee expressed in the account currency's atomic scale into the
 * fee-currency's atomic scale, preserving the human value. No-op when the units share a
 * magnitude (i.e. the fee currency is the account currency), so non-Celo coins are unaffected.
 * This corrects display when a coin module denominates the fee in the native-coin scale
 * (e.g. Celo's 18-decimal CIP-64 adapter amount) but the fee is shown against a sub-decimal
 * fee token (e.g. 6-decimal USDC). ROUND_FLOOR can floor a sub-1-atomic-unit fee to 0
 * (rendered as "-"), which does not occur for realistic fees.
 */
export function scaleFeesToDisplayUnit(
  fees: BigNumber,
  accountUnit: Unit,
  displayUnit: Unit,
): BigNumber {
  if (displayUnit.magnitude === accountUnit.magnitude) return fees;
  return fees
    .shiftedBy(displayUnit.magnitude - accountUnit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR);
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
