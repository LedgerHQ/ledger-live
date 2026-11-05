import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  getFeesCurrency,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  QuotesErrorCodes,
  type QuoteEstimatedNetworkFee,
} from "@ledgerhq/wallet-api-exchange-module";
import { toLocaleString } from "@ledgerhq/live-currency-format";
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

export const PERPS_DEPOSIT_ANALYTICS_CONTEXT = { page: "perps_deposit", flow: "perps" } as const;

const FEE_DISPLAY_DECIMALS = 7;

function formatDisplayAmount(
  amount: BigNumber,
  decimals: number,
  roundingMode: BigNumber.RoundingMode,
  locale: string,
): string {
  return toLocaleString(amount.decimalPlaces(decimals, roundingMode), locale, {
    maximumFractionDigits: decimals,
  });
}

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

function toAtomic(fee: QuoteEstimatedNetworkFee | undefined): BigNumber {
  return new BigNumber(fee?.amount ?? 0);
}

function notEnoughFeesError(
  feeAccount: Account,
  feeAtomic: BigNumber,
  locale: string,
): DepositFormError {
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
      fees: formatDisplayAmount(
        feeAtomic.shiftedBy(-magnitude),
        FEE_DISPLAY_DECIMALS,
        BigNumber.ROUND_UP,
        locale,
      ),
      ticker,
    },
  };
}

function getFeeError({
  depositAccount,
  feeAccount,
  quote,
  sentAmountAtomic,
  locale,
}: {
  depositAccount: AccountLike;
  feeAccount: Account;
  quote: PerpsDepositQuote | undefined;
  sentAmountAtomic: BigNumber | undefined;
  locale: string;
}): DepositFormError | null {
  const isTokenDeposit = depositAccount.type !== "Account";

  if (isTokenDeposit && feeAccount.spendableBalance.isZero()) {
    return notEnoughFeesError(feeAccount, new BigNumber(0), locale);
  }

  if (!quote) return null;

  const estimatedFee = toAtomic(quote.estimatedNetworkFee);

  if (isTokenDeposit) {
    const totalFee = estimatedFee.plus(toAtomic(quote.approvalNetworkFee));
    const exceedsBalance = totalFee.gt(feeAccount.spendableBalance);
    return exceedsBalance ? notEnoughFeesError(feeAccount, totalFee, locale) : null;
  }

  const exceedsBalance =
    quote.estimatedNetworkFee !== undefined &&
    sentAmountAtomic !== undefined &&
    sentAmountAtomic.plus(estimatedFee).gt(feeAccount.spendableBalance);
  return exceedsBalance ? notEnoughFeesError(feeAccount, estimatedFee, locale) : null;
}

function getAmountLimitError(
  result: PerpsDepositQuoteResult,
  depositAccount: AccountLike,
  locale: string,
): DepositFormError | null {
  const { ticker, units } = getAccountCurrency(depositAccount);
  const decimals = units[0].magnitude;
  for (const error of result.errors) {
    if (error.code === QuotesErrorCodes.AMOUNT_TOO_LOW) {
      return {
        code: "amountTooLow",
        labelKey: "perpsDeposit.formErrors.amountTooLow",
        values: {
          amount: formatDisplayAmount(
            new BigNumber(error.minAmount),
            decimals,
            BigNumber.ROUND_UP,
            locale,
          ),
          ticker,
        },
      };
    }
    if (error.code === QuotesErrorCodes.AMOUNT_TOO_HIGH) {
      return {
        code: "amountTooHigh",
        labelKey: "perpsDeposit.formErrors.amountTooHigh",
        values: {
          amount: formatDisplayAmount(
            new BigNumber(error.maxAmount),
            decimals,
            BigNumber.ROUND_DOWN,
            locale,
          ),
          ticker,
        },
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
  locale: string;
}>;

export function resolveDepositFormError({
  isOffline,
  baseError,
  depositAccount,
  parentAccount,
  depositAmount,
  sentAmountAtomic,
  quoteResult,
  locale,
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
    locale,
  });
  if (feeError) return feeError;
  if (baseError) return baseError;
  if (!quoteResult) return null;

  const amountLimitError = getAmountLimitError(quoteResult, depositAccount, locale);
  if (amountLimitError) return amountLimitError;

  return quoteResult.quote ? null : NO_QUOTES_ERROR;
}

export type DepositErrorDetails = Readonly<{
  titleKey: string;
  descriptionKey: string;
  values: Record<string, string>;
  buyTicker: string;
}>;

export type DepositBuyTarget = Readonly<{
  account: AccountLike;
  parentAccount: Account | undefined;
  details: DepositErrorDetails;
}>;

export function getDepositBuyTarget({
  statusError,
  depositAccount,
  parentAccount,
  getAccountName,
}: Readonly<{
  statusError: DepositFormError | null;
  depositAccount: AccountLike | undefined;
  parentAccount: Account | undefined;
  getAccountName: (account: AccountLike) => string;
}>): DepositBuyTarget | null {
  if (!depositAccount) return null;

  if (statusError?.code === "notEnoughFees") {
    const feeAccount = getDepositFeeAccount(depositAccount, parentAccount);
    if (!feeAccount) return null;
    const ticker = getAccountCurrency(feeAccount).ticker;
    return {
      account: feeAccount,
      parentAccount: undefined,
      details: {
        titleKey: "perpsDeposit.details.notEnoughFees.title",
        descriptionKey: "perpsDeposit.details.notEnoughFees.description",
        values: { ticker, account: getAccountName(feeAccount) },
        buyTicker: ticker,
      },
    };
  }

  if (statusError?.code === "amountTooLow") {
    const ticker = getAccountCurrency(depositAccount).ticker;
    return {
      account: depositAccount,
      parentAccount,
      details: {
        titleKey: "perpsDeposit.details.amountTooLow.title",
        descriptionKey: "perpsDeposit.details.amountTooLow.description",
        values: { ticker, amount: statusError.values?.amount ?? "" },
        buyTicker: ticker,
      },
    };
  }

  return null;
}
