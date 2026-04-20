import type { RawQuote } from "../service/types";
import type { Quote } from "../types";
import type { ProviderData } from "../lookupProviderConfig";
import { buildProviderDetails } from "./buildProviderDetails";
import { buildQuoteDetails } from "./buildQuoteDetails";
import { computeError, computeWarning, type NormalizationContext } from "./computeQuoteStatus";
import type { FeeEstimate } from "./networkFeeEstimate";
import { isGasLess, normalizedProviderId, resolveQuoteId } from "./quoteHelpers";

const EMPTY_CONTEXT: NormalizationContext = {
  sendCurrencyId: "",
  receiveCurrencyId: "",
  spotPrices: {},
};

/**
 * Enrich one raw quote with the swap `providerData` catalog and optional
 * normalization `context` (spot prices) / `feeEstimate`. Both extras are
 * optional so callers without them get a quote without warnings or fee
 * fields.
 */
export function normalizeQuote(
  rawQuote: RawQuote,
  providerData: ProviderData,
  context: NormalizationContext = EMPTY_CONTEXT,
  feeEstimate?: FeeEstimate,
): Quote {
  const provider = normalizedProviderId(rawQuote.provider);
  const gasLess = isGasLess(rawQuote);

  return {
    id: resolveQuoteId(rawQuote),
    key: rawQuote.key ?? `${provider}-${rawQuote.type}`,
    provider,
    providerDetails: buildProviderDetails(rawQuote, providerData),
    quoteDetails: buildQuoteDetails(rawQuote, gasLess, feeEstimate),
    warning: computeWarning(rawQuote, context),
    error: computeError(rawQuote, feeEstimate),
  };
}
