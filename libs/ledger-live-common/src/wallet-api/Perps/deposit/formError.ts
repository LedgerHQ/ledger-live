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
import { formatDisplayAmount } from "./formatAmount";
import {
  getAccountStateError,
  getMinimumBalanceError,
  needsFeeForMinimumBalance,
  type SpendableBalanceReader,
} from "./coinErrors";
import type { PerpsDepositQuote, PerpsDepositQuoteResult } from "./quote";

export type DepositFormErrorCode =
  | "offline"
  | "accountNotReady"
  | "seiEvmUnlinked"
  | "aleoPrivateBalance"
  | "tezosUnrevealed"
  | "insufficientBalance"
  | "notEnoughFees"
  | "dotMinimumBalance"
  | "xlmMinimumBalance"
  | "amountTooLow"
  | "amountTooHigh"
  | "feeEstimationFailed"
  | "noQuotes";

export type DepositFormError = Readonly<{
  code: DepositFormErrorCode;
  labelKey: string;
  values?: Record<string, string>;
  supportUrl?: string;
}>;

export const DEPOSIT_FORM_ERROR_ANALYTICS_MESSAGES: Record<DepositFormErrorCode, string> = {
  offline: "network_down",
  accountNotReady: "account_not_ready",
  seiEvmUnlinked: "sei_evm_unlinked_account",
  aleoPrivateBalance: "aleo_private_balance_unswappable",
  tezosUnrevealed: "tezos_unrevealed_account",
  insufficientBalance: "no_funds",
  notEnoughFees: "not_enough_network_fees",
  dotMinimumBalance: "dot_prevent_deactivating",
  xlmMinimumBalance: "xlm_prevent_deactivating",
  amountTooLow: "minAmount",
  amountTooHigh: "maxAmount",
  feeEstimationFailed: "fee_estimation_failed",
  noQuotes: "no_result",
};

export const PERPS_DEPOSIT_ANALYTICS_CONTEXT = { page: "perps_deposit", flow: "perps" } as const;

const FEE_DISPLAY_DECIMALS = 7;

const BASE_ERRORS_BEFORE_FEES: ReadonlySet<DepositFormErrorCode> = new Set([
  "accountNotReady",
  "seiEvmUnlinked",
  "aleoPrivateBalance",
  "tezosUnrevealed",
  "insufficientBalance",
  "notEnoughFees",
]);

const OFFLINE_ERROR: DepositFormError = {
  code: "offline",
  labelKey: "perpsDeposit.formErrors.offline",
};

const INSUFFICIENT_BALANCE_ERROR: DepositFormError = {
  code: "insufficientBalance",
  labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
};

const FEE_ESTIMATION_FAILED_ERROR: DepositFormError = {
  code: "feeEstimationFailed",
  labelKey: "perpsDeposit.formErrors.feeEstimationFailed",
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
  parentAccount?: Account;
  getSpendableBalance: SpendableBalanceReader;
}>;

export function getDepositBaseError({
  depositAccount,
  depositAmount,
  maxAmount,
  hasConversion,
  parentAccount,
  getSpendableBalance,
}: DepositBaseCheckParams): DepositFormError | null {
  if (!depositAccount || depositAmount <= 0) return null;
  const accountStateError = getAccountStateError(
    depositAccount,
    parentAccount,
    getSpendableBalance,
  );
  if (accountStateError) return accountStateError;
  if (maxAmount !== null && depositAmount > maxAmount) return INSUFFICIENT_BALANCE_ERROR;
  const emptyFeeAccountError = getEmptyFeeAccountError(
    depositAccount,
    parentAccount,
    getSpendableBalance,
  );
  if (emptyFeeAccountError) return emptyFeeAccountError;
  if (maxAmount === null || !hasConversion) return NO_QUOTES_ERROR;
  return null;
}

function feeAccountEmptyError(feeAccount: Account): DepositFormError {
  return {
    code: "notEnoughFees",
    labelKey: "perpsDeposit.formErrors.feeAccountEmpty",
    values: { ticker: getAccountCurrency(feeAccount).ticker },
  };
}

function getEmptyFeeAccountError(
  depositAccount: AccountLike,
  parentAccount: Account | undefined,
  getSpendableBalance: SpendableBalanceReader,
): DepositFormError | null {
  if (depositAccount.type === "Account") return null;
  const feeAccount = getDepositFeeAccount(depositAccount, parentAccount);
  return feeAccount && getSpendableBalance(feeAccount).isZero()
    ? feeAccountEmptyError(feeAccount)
    : null;
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

function notEnoughFeesError(
  feeAccount: Account,
  feeAtomic: BigNumber,
  locale: string,
): DepositFormError {
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
      ticker: getAccountCurrency(feeAccount).ticker,
    },
  };
}

function getFeeError({
  depositAccount,
  feeAccount,
  quote,
  sentAmountAtomic,
  locale,
  feeBalance,
}: {
  depositAccount: AccountLike;
  feeAccount: Account;
  quote: PerpsDepositQuote | undefined;
  sentAmountAtomic: BigNumber | undefined;
  locale: string;
  feeBalance: BigNumber;
}): DepositFormError | null {
  const isTokenDeposit = depositAccount.type !== "Account";

  if (!quote || hasForeignFeeCurrency(quote, feeAccount)) return null;

  const estimatedFee = toAtomic(quote.estimatedNetworkFee);
  const totalFee = estimatedFee.plus(toAtomic(quote.approvalNetworkFee));
  const isFlaggedByQuote =
    presentFeeFields(quote).length > 0 &&
    quote.errors.some(error => error.code === QuoteErrorCodes.NOT_ENOUGH_BALANCE_FOR_FEES);

  if (isTokenDeposit) {
    const exceedsBalance = totalFee.gt(feeBalance);
    return exceedsBalance || isFlaggedByQuote
      ? notEnoughFeesError(feeAccount, totalFee, locale)
      : null;
  }

  const exceedsBalance =
    quote.estimatedNetworkFee !== undefined &&
    sentAmountAtomic !== undefined &&
    sentAmountAtomic.plus(estimatedFee).gt(feeBalance);
  if (exceedsBalance) return notEnoughFeesError(feeAccount, estimatedFee, locale);
  return isFlaggedByQuote ? notEnoughFeesError(feeAccount, totalFee, locale) : null;
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
  getSpendableBalance: SpendableBalanceReader;
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
  getSpendableBalance,
}: ResolveDepositFormErrorParams): DepositFormError | null {
  if (!depositAccount || depositAmount <= 0) return baseError;
  if (isOffline) return OFFLINE_ERROR;
  if (baseError && BASE_ERRORS_BEFORE_FEES.has(baseError.code)) return baseError;

  const feeAccount = getDepositFeeAccount(depositAccount, parentAccount);
  const feeError = feeAccount
    ? getFeeError({
        depositAccount,
        feeAccount,
        quote: quoteResult?.quote,
        sentAmountAtomic,
        locale,
        feeBalance: getSpendableBalance(feeAccount),
      })
    : null;
  if (feeError) return feeError;
  if (baseError) return baseError;
  if (!quoteResult) return null;

  const { quote } = quoteResult;
  const hasUsableFee =
    quote !== undefined && feeAccount !== undefined && !hasForeignFeeCurrency(quote, feeAccount);
  const minimumBalanceError = getMinimumBalanceError(
    depositAccount,
    hasUsableFee ? quote : undefined,
    sentAmountAtomic,
    locale,
    getSpendableBalance,
  );
  if (minimumBalanceError) return minimumBalanceError;

  const amountLimitError = getAmountLimitError(quoteResult, depositAccount, locale);
  if (amountLimitError) return amountLimitError;
  if (quote && quoteResult.feeEstimationFailed) return FEE_ESTIMATION_FAILED_ERROR;

  const isQuoteUsable = hasUsableFee && !needsFeeForMinimumBalance(depositAccount, quote);
  return isQuoteUsable ? null : NO_QUOTES_ERROR;
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
