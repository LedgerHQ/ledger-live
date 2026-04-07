import { getEnv } from "@ledgerhq/live-env";

import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { fetchQuotes } from "./service/fetchQuotes";
import { normalizeQuote } from "./normalizer";
import type { GetQuotesArgs, GetQuotesResponse } from "./types";

export async function getQuotes(args: GetQuotesArgs): Promise<GetQuotesResponse> {
  const { rawQuotes, errors } = await fetchQuotes(args);

  const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";
  const providerData = await fetchAndMergeProviderData({
    ledgerSignatureEnv,
    partnerSignatureEnv,
  });

  const quotes = rawQuotes.map(raw => normalizeQuote(raw, providerData));

  return { quotes, errors };
}
