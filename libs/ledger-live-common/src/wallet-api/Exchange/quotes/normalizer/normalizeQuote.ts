import type { RawQuote } from "../service/types";
import type { Quote } from "../types";
import type { ProviderData } from "../lookupProviderConfig";
import { buildProviderDetails } from "./buildProviderDetails";
import { buildQuoteDetails } from "./buildQuoteDetails";
import { computeError, computeWarning, type NormalizationContext } from "./computeQuoteStatus";
import { isGasLess, normalizedProviderId, resolveQuoteId } from "./quoteHelpers";

const EMPTY_CONTEXT: NormalizationContext = {
  sendCurrencyId: "",
  receiveCurrencyId: "",
  spotPrices: {},
};

export function normalizeQuote(
  rawQuote: RawQuote,
  providerData: ProviderData,
  context: NormalizationContext = EMPTY_CONTEXT,
): Quote {
  const provider = normalizedProviderId(rawQuote.provider);
  const gasLess = isGasLess(rawQuote);

  return {
    id: resolveQuoteId(rawQuote),
    key: rawQuote.key ?? `${provider}-${rawQuote.type}`,
    provider,
    providerDetails: buildProviderDetails(rawQuote, providerData),
    quoteDetails: buildQuoteDetails(rawQuote, gasLess),
    warning: computeWarning(rawQuote, context),
    error: computeError(rawQuote, context),
  };
}
