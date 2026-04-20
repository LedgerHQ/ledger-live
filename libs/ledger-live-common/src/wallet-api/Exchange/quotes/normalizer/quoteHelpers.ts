import type { QuoteLiquiditySource } from "../types";
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

/**
 * Derived from {@link computeLiquiditySource} rather than the raw API
 * `liquiditySource`, which is unreliable for RFQ providers like
 * `oneinchfusion` and UniswapX-tagged rows.
 */
export function isGasLess(quote: RawQuote): boolean {
  return computeLiquiditySource(quote) === "RFQ";
}

/**
 * Classify a quote's liquidity source from the provider id and
 * `customFields["@type"]` tag. The raw `liquiditySource` API field is
 * unreliable for `oneinchfusion` and UniswapDutch-tagged rows.
 */
export function computeLiquiditySource(quote: RawQuote): QuoteLiquiditySource {
  if (quote.provider === "oneinchfusion" || isUniswapXQuote(quote)) {
    return "RFQ";
  }
  return "AMM";
}

/**
 * Round fractional slippage to one decimal place; safe-integer presets
 * (0, 1, 2...) pass through untouched.
 */
export function normalizeSlippage(slippage: number): number {
  if (Number.isSafeInteger(slippage)) {
    return slippage;
  }
  return Number.parseFloat(slippage.toFixed(1));
}
