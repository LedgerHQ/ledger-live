import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
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
import { findDepositParentAccount } from "./formError";

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
};

function toPerpsDepositQuote({ id, quoteDetails, errors }: Quote): PerpsDepositQuote {
  return {
    amountTo: new BigNumber(quoteDetails.receiveAmount),
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
export async function fetchPerpsDepositQuote({
  accounts,
  depositAccount,
  receiverAccount,
  amount,
  counterValueCurrency,
  locale,
}: PerpsDepositQuoteParams): Promise<PerpsDepositQuoteResult> {
  registerQuoteAccounts(accounts, depositAccount, receiverAccount);

  const { quotes, errors } = await getQuotes(
    {
      providers: [PERPS_SWAPKIT_PROVIDER],
      data: {
        amount,
        sendAccountId: getWalletApiIdFromAccountId(depositAccount.id),
        receiveAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
      },
    },
    { accounts, spotPrices: {}, locale, counterValueCurrency },
  );

  const [quote] = quotes;
  return quote ? { quote: toPerpsDepositQuote(quote), errors } : { errors };
}
