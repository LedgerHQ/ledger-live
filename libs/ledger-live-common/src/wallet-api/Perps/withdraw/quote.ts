import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { DEFAULT_SWAP_RATES_INTERVAL_MS } from "../../../exchange/swap/const/timeout";
import { getWalletApiIdFromAccountId } from "../../converters";
import { resolveQuoteId } from "../../Exchange/quotes/normalizer/quoteHelpers";
import { resolveQuotesInput } from "../../Exchange/quotes/resolveQuotesInput";
import { fetchQuotes } from "../../Exchange/quotes/service/fetchQuotes";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import { toWithdrawError, WithdrawApiError } from "./errors";
import { WithdrawPayloadSchema, type WithdrawPayload } from "./schemas";

// Swap quotes carry no expiry, so a withdraw quote is refreshed like swap rates.
export const PERPS_WITHDRAW_QUOTE_TTL_MS = DEFAULT_SWAP_RATES_INTERVAL_MS;

export type WithdrawQuoteRequest = {
  sourceAccount: AccountLike;
  destinationAccount: AccountLike;
  amount: string;
};

export type PerpsWithdrawQuoteParams = WithdrawQuoteRequest & {
  accounts: AccountLike[];
  counterValueCurrency: string;
};

export type WithdrawQuote = {
  quoteId?: string;
  amountTo: BigNumber;
  payoutNetworkFees: BigNumber;
  expiry: number;
  /** Typed data to sign, resubmitted unmodified with the signature. */
  payload?: WithdrawPayload;
};

export async function fetchPerpsWithdrawQuote({
  accounts,
  sourceAccount,
  destinationAccount,
  amount,
  counterValueCurrency,
}: PerpsWithdrawQuoteParams): Promise<WithdrawQuote> {
  const quotesInput = resolveQuotesInput(
    {
      amount,
      sendAccountId: getWalletApiIdFromAccountId(sourceAccount.id),
      receiveAccountId: getWalletApiIdFromAccountId(destinationAccount.id),
    },
    accounts,
  );
  if (!quotesInput) throw new WithdrawApiError("Withdraw accounts cannot be resolved");

  const { rawQuotes, providerErrors } = await fetchQuotes(
    { providers: [PERPS_SWAPKIT_PROVIDER], data: quotesInput },
    counterValueCurrency,
  );

  const [quote] = rawQuotes;
  if (quote) {
    const payload = WithdrawPayloadSchema.safeParse(quote.customFields);
    return {
      quoteId: resolveQuoteId(quote),
      amountTo: new BigNumber(quote.amountTo),
      payoutNetworkFees: new BigNumber(quote.payoutNetworkFees?.value ?? 0),
      expiry: Date.now() + PERPS_WITHDRAW_QUOTE_TTL_MS,
      ...(payload.success ? { payload: payload.data } : {}),
    };
  }

  const [providerError] = providerErrors;
  if (!providerError) throw new WithdrawApiError("No withdraw quote");
  throw toWithdrawError({
    status: 400,
    body: {
      code: providerError.code,
      message: providerError.message,
      additionalFields: providerError.parameter,
    },
  });
}
