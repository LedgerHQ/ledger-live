import type BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import type {
  Quote,
  QuoteApprovalNetworkFee,
  QuoteError,
  QuoteEstimatedNetworkFee,
  QuotesError,
} from "@ledgerhq/wallet-api-exchange-module";
import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "../../converters";
import { getQuotes } from "../../Exchange/quotes/getQuotes";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";

export type PerpsDepositQuoteParams = {
  accounts: AccountLike[];
  depositAccount: AccountLike;
  receiverAccount: AccountLike;
  amount: string;
  counterValueCurrency: string;
  locale: string;
};

export type PerpsDepositQuote = {
  amountTo: BigNumber;
  quoteId?: string;
  estimatedNetworkFee?: QuoteEstimatedNetworkFee;
  approvalNetworkFee?: QuoteApprovalNetworkFee;
  errors: QuoteError[];
};

export type PerpsDepositQuoteResult = {
  quote?: PerpsDepositQuote;
  errors: QuotesError[];
  feeEstimationFailed?: boolean;
};

export function findDepositParentAccount(
  depositAccount: AccountLike,
  accounts: readonly AccountLike[],
): Account | undefined {
  if (depositAccount.type !== "TokenAccount") return undefined;
  const parentAccount = accounts.find(account => account.id === depositAccount.parentId);
  return parentAccount?.type === "Account" ? parentAccount : undefined;
}

/** A quote with an unreadable receive amount is dropped, so the form shows no quote. */
function toPerpsDepositQuote({ id, quoteDetails, errors }: Quote): PerpsDepositQuote | undefined {
  const amountTo = parseFiniteBigNumber(quoteDetails.receiveAmount);
  if (!amountTo) return undefined;
  return {
    amountTo,
    quoteId: id,
    estimatedNetworkFee: quoteDetails.estimatedNetworkFee,
    approvalNetworkFee: quoteDetails.approvalNetworkFee,
    errors,
  };
}

function registerQuoteAccounts(
  accounts: AccountLike[],
  depositAccount: AccountLike,
  receiverAccount: AccountLike,
) {
  const parentAccount = findDepositParentAccount(depositAccount, accounts);
  setWalletApiIdForAccountId(depositAccount.id);
  if (parentAccount) setWalletApiIdForAccountId(parentAccount.id);
  setWalletApiIdForAccountId(receiverAccount.id);
}

/**
 * Quotes `amount` from `depositAccount` to `receiverAccount` against
 * `swapkit_hyperliquid` and returns the first quote with the global errors.
 */
const BALANCE_ERROR_NAMES = new Set([
  "NotEnoughBalance",
  "NotEnoughGas",
  "NotEnoughBalanceInParentAccount",
]);

function isBalanceError(error: unknown): boolean {
  return error instanceof Error && BALANCE_ERROR_NAMES.has(error.name);
}

export async function fetchPerpsDepositQuote({
  accounts,
  depositAccount,
  receiverAccount,
  amount,
  counterValueCurrency,
  locale,
}: PerpsDepositQuoteParams): Promise<PerpsDepositQuoteResult> {
  registerQuoteAccounts(accounts, depositAccount, receiverAccount);

  let feeEstimationFailed = false;
  const { quotes, errors } = await getQuotes(
    {
      providers: [PERPS_SWAPKIT_PROVIDER],
      data: {
        amount,
        sendAccountId: getWalletApiIdFromAccountId(depositAccount.id),
        receiveAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
      },
    },
    {
      accounts,
      spotPrices: {},
      locale,
      counterValueCurrency,
      onFeeEstimationFailed: error => {
        feeEstimationFailed = !isBalanceError(error);
      },
    },
  );

  const quote = quotes[0] && toPerpsDepositQuote(quotes[0]);
  return { ...(quote && { quote }), errors, feeEstimationFailed };
}
