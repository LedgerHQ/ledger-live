import { getQuotes, type GetQuotesContext } from "./getQuotes";
import type { GetBestQuoteArgs, GetBestQuoteResponse } from "./types";

export async function getBestQuote(
  args: GetBestQuoteArgs,
  context: GetQuotesContext,
): Promise<GetBestQuoteResponse> {
  const response = await getQuotes(args, context);
  const [bestQuote] = response.quotes;

  if (bestQuote) {
    return bestQuote;
  }

  return {
    providerErrors: response.providerErrors,
    errors: response.errors,
  };
}
