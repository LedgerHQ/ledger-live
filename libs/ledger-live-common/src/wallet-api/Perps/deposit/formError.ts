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
import { formatDisplayAmount } from "./formatAmount";
import {
  getAccountStateError,
  getDepositSpendableBalance,
  getMinimumBalanceError,
  needsFeeForMinimumBalance,
} from "./coinErrors";
import type { PerpsDepositQuote, PerpsDepositQuoteResult } from "./quote";

export type DepositFormErrorCode =
  | "offline"
  | "seiEvmUnlinked"
  | "aleoPrivateBalance"
  | "tezosUnrevealed"
  | "insufficientBalance"
  | "notEnoughFees"
  | "dotMinimumBalance"
  | "xlmMinimumBalance"
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
  seiEvmUnlinked: "sei_evm_unlinked_account",
  aleoPrivateBalance: "aleo_private_balance_unswappable",
  tezosUnrevealed: "tezos_unrevealed_account",
  insufficientBalance: "no_funds",
  notEnoughFees: "not_enough_network_fees",
  dotMinimumBalance: "dot_prevent_deactivating",
  xlmMinimumBalance: "xlm_prevent_deactivating",
  amountTooLow: "minAmount",
  amountTooHigh: "maxAmount",
  noQuotes: "no_result",
};

export const PERPS_DEPOSIT_ANALYTICS_CONTEXT = { page: "perps_deposit", flow: "perps" } as const;

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
  parentAccount?: Account;
}>;

export function getDepositBaseError({
  depositAccount,
  depositAmount,
  maxAmount,
  hasConversion,
  parentAccount,
}: DepositBaseCheckParams): DepositFormError | null {
  if (!depositAccount || depositAmount <= 0) return null;
  const accountStateError = getAccountStateError(depositAccount, parentAccount);
  if (accountStateError) return accountStateError;
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

  const feeBalance = getDepositSpendableBalance(feeAccount);

  if (isTokenDeposit && feeBalance.isZero()) {
    return notEnoughFeesError(feeAccount, new BigNumber(0), locale);
  }

  if (!quote) return null;

  const estimatedFee = toAtomic(quote.estimatedNetworkFee);

  if (isTokenDeposit) {
    const totalFee = estimatedFee.plus(toAtomic(quote.approvalNetworkFee));
    const exceedsBalance = totalFee.gt(feeBalance);
    return exceedsBalance ? notEnoughFeesError(feeAccount, totalFee, locale) : null;
  }

  const exceedsBalance =
    quote.estimatedNetworkFee !== undefined &&
    sentAmountAtomic !== undefined &&
    sentAmountAtomic.plus(estimatedFee).gt(feeBalance);
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
  if (!depositAccount || depositAmount <= 0) return baseError;

  const accountStateError = getAccountStateError(depositAccount, parentAccount);
  if (accountStateError) return accountStateError;
  if (baseError?.code === "insufficientBalance") return baseError;

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

  const { quote } = quoteResult;
  const minimumBalanceError = getMinimumBalanceError(
    depositAccount,
    quote,
    sentAmountAtomic,
    locale,
  );
  if (minimumBalanceError) return minimumBalanceError;

  const amountLimitError = getAmountLimitError(quoteResult, depositAccount, locale);
  if (amountLimitError) return amountLimitError;

  return quote && !needsFeeForMinimumBalance(depositAccount, quote) ? null : NO_QUOTES_ERROR;
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
