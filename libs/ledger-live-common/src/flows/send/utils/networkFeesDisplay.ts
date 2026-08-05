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

/**
 * Rounding is left on: an 18-magnitude fee printed in full (`0.000026052026217 ETH`) wraps onto two
 * lines and buries the digits that matter. The default dynamic rounding keeps ~8 significant digits,
 * which is what the designs show and is still far more precision than a fee needs.
 */
export function formatFeeCurrencyAmount(unit: Unit, amount: BigNumber, locale?: string): string {
  return formatCurrencyUnit(unit, amount, {
    showCode: true,
    ...(locale ? { locale } : {}),
  });
}

/** Separator between the fiat and native amounts of a fee-preset sublabel (`$0.03 · 0.000329 ETH`). */
const FEE_SUBLABEL_SEPARATOR = " · ";

export function joinFeeSublabelValues(fiat: string | null, crypto: string | null): string | null {
  if (fiat && crypto) return `${fiat}${FEE_SUBLABEL_SEPARATOR}${crypto}`;
  return fiat ?? crypto;
}

/**
 * How the fee row renders its amount:
 * - `"fiat"` / `"crypto"`: a single value, following the amount input's fiat⇄crypto toggle. Only
 *   reachable for coins whose fees the user can edit.
 * - `"both"`: fiat plus the native fee-currency amount, for coins whose fees are not editable — the
 *   row is the only place they can see what the network will actually take.
 */
export type FeesValueMode = "fiat" | "crypto" | "both";

export type FormatFeesValueParams = Readonly<{
  estimatedFees: BigNumber;
  estimatedFeesCountervalue: BigNumber | null | undefined;
  fiatUnit: Unit;
  displayUnit: Unit;
  locale?: string;
  mode: FeesValueMode;
}>;

export type FormattedFeesValue = Readonly<{
  /** Main value: fiat in `"fiat"`/`"both"`, the native amount in `"crypto"`, `"-"` when unknown. */
  displayFeesValue: string;
  /** Native amount rendered after (and dimmer than) the main value. Only set in `"both"`. */
  secondaryFeesValue: string | null;
}>;

/**
 * Fee row value for the requested mode. `"fiat"` prefers fiat and falls back to the native amount
 * when there is no rate; `"crypto"` always shows the native amount. Both of those single-value modes
 * render `"-"` when the fee is not a positive finite value (zero, negative, or non-finite).
 *
 * `"both"` treats a non-finite/negative estimate as zero and shows `0 fiat` next to `0 <code>`, since
 * a zero fee is accurate information rather than a missing value. With no rate for a non-zero fee the
 * native amount takes the main slot alone rather than implying a zero fiat rate.
 */
export function formatFeesValue(params: FormatFeesValueParams): FormattedFeesValue {
  const isZeroFee = !params.estimatedFees.isFinite() || params.estimatedFees.lte(0);

  if (params.mode === "both") {
    const cryptoAmount = isZeroFee ? new BigNumber(0) : params.estimatedFees;
    const crypto = formatFeeCurrencyAmount(params.displayUnit, cryptoAmount, params.locale);

    const fiatAmount = isZeroFee
      ? new BigNumber(0)
      : new BigNumber(params.estimatedFeesCountervalue ?? 0);
    if (isZeroFee || fiatAmount.gt(0)) {
      return {
        displayFeesValue: formatFeeCurrencyAmount(params.fiatUnit, fiatAmount, params.locale),
        secondaryFeesValue: crypto,
      };
    }

    return { displayFeesValue: crypto, secondaryFeesValue: null };
  }

  if (isZeroFee) {
    return { displayFeesValue: "-", secondaryFeesValue: null };
  }

  const fiatAmount = new BigNumber(params.estimatedFeesCountervalue ?? 0);
  const fiat =
    params.mode === "fiat" && fiatAmount.gt(0)
      ? formatFeeCurrencyAmount(params.fiatUnit, fiatAmount, params.locale)
      : null;

  return {
    displayFeesValue:
      fiat ?? formatFeeCurrencyAmount(params.displayUnit, params.estimatedFees, params.locale),
    secondaryFeesValue: null,
  };
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
