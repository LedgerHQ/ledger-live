import {
  getQuotes,
  type Quote,
  type QuotesError,
} from "@ledgerhq/live-common/wallet-api/Exchange/index";

export type AgentSwapQuote = { provider: string; receiveAmount: number };

/** A quote the Agent Intent frontend can prepare without an extra signature: it never crafts a
 * token approval or a Permit2 message, so those would leave the intent stuck in review. */
function isPreparable(quote: Quote): boolean {
  const { tokenAllowance, permitData } = quote.quoteDetails;
  return quote.errors.length === 0 && tokenAllowance?.isApproved !== false && !permitData;
}

function describeQuotesError(error: QuotesError): string {
  if ("minAmount" in error) return `amount too low (minimum: ${error.minAmount})`;
  if ("maxAmount" in error) return `amount too high (maximum: ${error.maxAmount})`;
  return error.code;
}

/**
 * Best quote for selling `amount` of `from` for `to` from `sender`'s own address, among
 * `providers`. Quotes come back best first (highest receive amount when no prices are given).
 */
export async function fetchAgentSwapQuote(
  request: {
    from: string;
    to: string;
    amount: string;
    sender: string;
    providers: readonly string[];
  },
  quotes: typeof getQuotes = getQuotes,
): Promise<AgentSwapQuote> {
  const result = await quotes(
    {
      providers: [...request.providers],
      data: {
        amount: request.amount,
        uniswapOrderType: "classic",
        sendCurrencyId: request.from,
        receiveCurrencyId: request.to,
        sendAddress: request.sender,
        receiveAddress: request.sender,
        sendAccountId: "",
        receiveAccountId: "",
      },
    },
    { accounts: [], spotPrices: {}, locale: "en", counterValueCurrency: "USD" },
  );

  const quote = result.quotes.find(isPreparable);
  if (quote) return { provider: quote.provider, receiveAmount: quote.quoteDetails.receiveAmount };

  if (result.quotes.length > 0) {
    throw new Error(
      "Every quote needs a token approval or Permit2 signature first, which the Agent Intent " +
        "frontend can't prepare yet. Approve the provider's router for this token, or pick another " +
        "provider with --provider.",
    );
  }
  const reasons = [
    ...result.errors.map(describeQuotesError),
    ...result.providerErrors.map(e => `${e.provider}: ${e.message}`),
  ];
  const detail = reasons.length > 0 ? `: ${reasons.join("; ")}` : "";
  throw new Error(`No swap quote available${detail}.`);
}
