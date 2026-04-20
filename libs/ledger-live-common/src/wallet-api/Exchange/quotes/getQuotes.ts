import { getEnv } from "@ledgerhq/live-env";

import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { fetchQuotes } from "./service/fetchQuotes";
import { normalizeQuote } from "./normalizer";
import type { GetQuotesArgs, GetQuotesResponse } from "./types";
import { isUnsupportedPair } from "./unsupportedPairs";

export async function getQuotes(args: GetQuotesArgs): Promise<GetQuotesResponse> {
  const { rawQuotes, errors } = await fetchQuotes(args);

  // Drop every successful quote when the pair is on the wallet-side blocklist
  // and skip the provider-data fetch (CAL + CDN) entirely since nothing would
  // be normalized. Aggregator errors still flow through so consumers can
  // surface provider-level failures for the same pair.
  if (isUnsupportedPair(args.data.sendCurrencyId, args.data.receiveCurrencyId)) {
    return { quotes: [], errors };
  }

  const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";
  const providerData = await fetchAndMergeProviderData({
    ledgerSignatureEnv,
    partnerSignatureEnv,
  });

  const quotes = rawQuotes.map(raw => normalizeQuote(raw, providerData));

  return { quotes, errors };
}
