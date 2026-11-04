import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getFeesCurrency,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  QuoteErrorCodes,
  QuotesErrorCodes,
  type QuoteEstimatedNetworkFee,
} from "@ledgerhq/wallet-api-exchange-module";
import type { PerpsDepositQuote, PerpsDepositQuoteResult } from "./quote";

export type DepositFormErrorCode =
  | "offline"
  | "insufficientBalance"
  | "notEnoughFees"
  | "amountTooLow"
  | "amountTooHigh"
  | "noQuotes";

export type DepositFormError = Readonly<{
  code: DepositFormErrorCode;
  labelKey: string;
  values?: Record<string, string>;
  supportUrl?: string;
}>;

export const DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES: Record<DepositFormErrorCode, string> = {
  offline: "network_down",
  insufficientBalance: "no_funds",
  notEnoughFees: "not_enough_network_fees",
  amountTooLow: "minAmount",
  amountTooHigh: "maxAmount",
  noQuotes: "no_result",
};

const FEE_DISPLAY_DECIMALS = 7;

const OFFLINE_ERROR: DepositFormError = {
  code: "offline",
  labelKey: "perpsDeposit.formErrors.offline",
};

const INSUFFICIENT_BALANCE_ERROR: DepositFormError = {
  code: "insufficientBalance",
  labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
};

const NO_QUOTES_ERROR: DepositFormError = {
  code: "noQuotes",
  labelKey: "perpsDeposit.formErrors.quoteUnavailable",
};

export type DepositBaseCheckParams = Readonly<{
  depositAccount: AccountLike | undefined;
  depositAmount: number;
  maxAmount: number | null;
  hasConversion: boolean;
}>;

export function getDepositBaseError({
  depositAccount,
  depositAmount,
  maxAmount,
  hasConversion,
}: DepositBaseCheckParams): DepositFormError | null {
  if (!depositAccount || depositAmount <= 0) return null;
  if (maxAmount === null) return NO_QUOTES_ERROR;
  if (depositAmount > maxAmount) return INSUFFICIENT_BALANCE_ERROR;
  if (!hasConversion) return NO_QUOTES_ERROR;
  return null;
}

export function getDepositFeeAccount(
  depositAccount: AccountLike,
  parentAccount: Account | undefined,
): Account | undefined {
  const mainAccount = depositAccount.type === "Account" ? depositAccount : parentAccount;
  if (!mainAccount) return undefined;
  const isFeePaidInMainCurrency = getFeesCurrency(mainAccount).id === mainAccount.currency.id;
  return isFeePaidInMainCurrency ? mainAccount : undefined;
}

function presentFeeFields(quote: PerpsDepositQuote): QuoteEstimatedNetworkFee[] {
  return [quote.estimatedNetworkFee, quote.approvalNetworkFee].filter(
    (fee): fee is QuoteEstimatedNetworkFee => fee !== undefined,
  );
}

function hasForeignFeeCurrency(quote: PerpsDepositQuote, feeAccount: Account): boolean {
  return presentFeeFields(quote).some(fee => fee.currencyId !== feeAccount.currency.id);
}

function toAtomic(fee: QuoteEstimatedNetworkFee | undefined): BigNumber {
  return new BigNumber(fee?.amount ?? 0);
}

function notEnoughFeesError(feeAccount: Account, feeAtomic: BigNumber): DepositFormError {
  const ticker = getAccountCurrency(feeAccount).ticker;
  if (feeAtomic.isZero()) {
    return {
      code: "notEnoughFees",
      labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
      values: { ticker },
    };
  }
  const magnitude = feeAccount.currency.units[0].magnitude;
  return {
    code: "notEnoughFees",
    labelKey: "perpsDeposit.formErrors.notEnoughFees",
    values: {
      fees: feeAtomic
        .shiftedBy(-magnitude)
        .decimalPlaces(FEE_DISPLAY_DECIMALS, BigNumber.ROUND_UP)
        .toFixed(),
      ticker,
    },
  };
}

function getFeeError({
  depositAccount,
  feeAccount,
  quote,
  sentAmountAtomic,
}: {
  depositAccount: AccountLike;
  feeAccount: Account;
  quote: PerpsDepositQuote | undefined;
  sentAmountAtomic: BigNumber | undefined;
}): DepositFormError | null {
  const isTokenDeposit = depositAccount.type !== "Account";

  if (isTokenDeposit && feeAccount.spendableBalance.isZero()) {
    return notEnoughFeesError(feeAccount, new BigNumber(0));
  }

  if (!quote || hasForeignFeeCurrency(quote, feeAccount)) return null;

  const estimatedFee = toAtomic(quote.estimatedNetworkFee);
  const totalFee = estimatedFee.plus(toAtomic(quote.approvalNetworkFee));
  const isFlaggedByQuote = quote.errors.some(
    error => error.code === QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES,
  );

  if (isTokenDeposit) {
    const exceedsBalance =
      presentFeeFields(quote).length > 0 && totalFee.gt(feeAccount.spendableBalance);
    return isFlaggedByQuote || exceedsBalance ? notEnoughFeesError(feeAccount, totalFee) : null;
  }

  const exceedsBalance =
    quote.estimatedNetworkFee !== undefined &&
    sentAmountAtomic !== undefined &&
    sentAmountAtomic.plus(estimatedFee).gt(feeAccount.spendableBalance);
  if (exceedsBalance) return notEnoughFeesError(feeAccount, estimatedFee);
  return isFlaggedByQuote ? notEnoughFeesError(feeAccount, totalFee) : null;
}

function getAmountLimitError(
  result: PerpsDepositQuoteResult,
  ticker: string,
): DepositFormError | null {
  for (const error of result.errors) {
    if (error.code === QuotesErrorCodes.AMOUNT_TOO_LOW) {
      return {
        code: "amountTooLow",
        labelKey: "perpsDeposit.formErrors.amountTooLow",
        values: { amount: error.minAmount, ticker },
      };
    }
    if (error.code === QuotesErrorCodes.AMOUNT_TOO_HIGH) {
      return {
        code: "amountTooHigh",
        labelKey: "perpsDeposit.formErrors.amountTooHigh",
        values: { amount: error.maxAmount, ticker },
      };
    }
  }
  return null;
}

export type ResolveDepositFormErrorParams = Readonly<{
  isOffline: boolean;
  baseError: DepositFormError | null;
  depositAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
  depositAmount: number;
  sentAmountAtomic: BigNumber | undefined;
  quoteResult: PerpsDepositQuoteResult | undefined;
}>;

export function resolveDepositFormError({
  isOffline,
  baseError,
  depositAccount,
  parentAccount,
  depositAmount,
  sentAmountAtomic,
  quoteResult,
}: ResolveDepositFormErrorParams): DepositFormError | null {
  if (isOffline) return OFFLINE_ERROR;
  if (baseError?.code === "insufficientBalance") return baseError;
  if (!depositAccount || depositAmount <= 0) return baseError;

  const feeAccount = getDepositFeeAccount(depositAccount, parentAccount);
  if (!feeAccount) return NO_QUOTES_ERROR;

  const feeError = getFeeError({
    depositAccount,
    feeAccount,
    quote: quoteResult?.quote,
    sentAmountAtomic,
  });
  if (feeError) return feeError;
  if (baseError) return baseError;
  if (!quoteResult) return null;

  const amountLimitError = getAmountLimitError(
    quoteResult,
    getAccountCurrency(depositAccount).ticker,
  );
  if (amountLimitError) return amountLimitError;

  const { quote } = quoteResult;
  if (!quote || hasForeignFeeCurrency(quote, feeAccount)) return NO_QUOTES_ERROR;
  return null;
}
