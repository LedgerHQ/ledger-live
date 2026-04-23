import type { RawQuote } from "../service/types";

export function resolveQuoteId(quote: RawQuote): string | undefined {
  if (quote.quoteId) {
    return quote.quoteId;
  }
  const maybeQuoteId = quote.customFields?.quoteId;
  return typeof maybeQuoteId === "string" && maybeQuoteId.length > 0 ? maybeQuoteId : undefined;
}

export function normalizedProviderId(provider: string): string {
  return provider === "changelly_v2" ? "changelly" : provider;
}

export function isUniswapXQuote(quote: RawQuote): boolean {
  return Boolean(quote.customFields?.["@type"]?.includes("UniswapDutchCustomFields"));
}

export function isGasLess(quote: RawQuote): boolean {
  return quote.liquiditySource === "RFQ";
}
