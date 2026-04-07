import type { RawQuote } from "../service/types";
import type { ProviderDetails } from "../types";
import { getProviderDisplayName, lookupProvider, type ProviderData } from "../lookupProviderConfig";
import { isUniswapXQuote } from "./quoteHelpers";

export function buildProviderDetails(quote: RawQuote, providerData: ProviderData): ProviderDetails {
  const config = lookupProvider(providerData, quote.provider);
  const displayName = getProviderDisplayName(config, quote.provider);
  const isUniswapX = isUniswapXQuote(quote);

  return {
    name: displayName,
    type: quote.providerType,
    url: quote.providerURL ?? config?.mainUrl,
    isUniswapX,
    requiresKYC: Boolean(config?.needsKYC),
    continuesInProviderLiveApp: Boolean(config?.useInExchangeApp),
  };
}
