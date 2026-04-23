import type { RawQuote } from "../service/types";
import type { Quote } from "../types";
import type { ProviderData } from "../lookupProviderConfig";
import { buildProviderDetails } from "./buildProviderDetails";
import { buildQuoteDetails } from "./buildQuoteDetails";
import { computeError, computeWarning } from "./computeQuoteStatus";
import { isGasLess, normalizedProviderId, resolveQuoteId } from "./quoteHelpers";

/**
 * Enrich one raw HTTP quote row using the full swap `providerData` catalog (CAL + CDN).
 */
export function normalizeQuote(rawQuote: RawQuote, providerData: ProviderData): Quote {
  const provider = normalizedProviderId(rawQuote.provider);
  const gasLess = isGasLess(rawQuote);

  return {
    id: resolveQuoteId(rawQuote),
    key: rawQuote.key ?? `${provider}-${rawQuote.type}`,
    provider,
    providerDetails: buildProviderDetails(rawQuote, providerData),
    quoteDetails: buildQuoteDetails(rawQuote, gasLess),
    warning: computeWarning(rawQuote),
    error: computeError(rawQuote),
  };
}
