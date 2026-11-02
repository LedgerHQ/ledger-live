import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getWalletApiIdFromAccountId } from "../../converters";
import { resolveQuoteId } from "../../Exchange/quotes/normalizer/quoteHelpers";
import { resolveQuotesInput } from "../../Exchange/quotes/resolveQuotesInput";
import { fetchQuotes } from "../../Exchange/quotes/service/fetchQuotes";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";

export type PerpsDepositQuoteParams = {
  accounts: AccountLike[];
  depositAccount: AccountLike;
  receiverAccount: AccountLike;
  amount: string;
  counterValueCurrency: string;
};

export type PerpsDepositQuote = {
  amountTo: BigNumber;
  quoteId?: string;
};

/**
 * Quotes `amount` from `depositAccount` to `receiverAccount` against
 * `swapkit_hyperliquid` and returns the quoted `amountTo` in display units.
 */
export async function fetchPerpsDepositQuote({
  accounts,
  depositAccount,
  receiverAccount,
  amount,
  counterValueCurrency,
}: PerpsDepositQuoteParams): Promise<PerpsDepositQuote | undefined> {
  const quotesInput = resolveQuotesInput(
    {
      amount,
      sendAccountId: getWalletApiIdFromAccountId(depositAccount.id),
      receiveAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
    },
    accounts,
  );

  if (!quotesInput) return undefined;

  const { rawQuotes } = await fetchQuotes(
    { providers: [PERPS_SWAPKIT_PROVIDER], data: quotesInput },
    counterValueCurrency,
  );

  const [quote] = rawQuotes;

  return quote
    ? { amountTo: new BigNumber(quote.amountTo), quoteId: resolveQuoteId(quote) }
    : undefined;
}
