import { getEnv } from "@ledgerhq/live-env";
import type { AccountLike } from "@ledgerhq/types-live";

import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { fetchNetworkFeeContext } from "./fetchNetworkFeeContext";
import { fetchQuotes } from "./service/fetchQuotes";
import { computeFeeEstimate } from "./normalizer/networkFeeEstimate";
import { buildFormatContext } from "./normalizer/buildFormatContext";
import { normalizeQuote } from "./normalizer";
import type { GetQuotesArgs, GetQuotesResponse } from "./types";
import { isUnsupportedPair } from "./unsupportedPairs";

/**
 * Server-side dependencies for {@link getQuotes}. Not part of the public
 * wire contract: `GetQuotesWireArgs` stays minimal, and each caller of
 * `getQuotes` is responsible for constructing a `GetQuotesContext` from
 * the wallet state it already has on hand.
 *
 * The wallet-api RPC handler in `server.ts` fills this from the
 * `handlers({ accounts, locale, counterValueCurrency, ... })` factory
 * arg. Native callers inside ledger-live-desktop or ledger-live-mobile
 * build it from their Redux store. Tests build it inline.
 *
 * Fields:
 *   - `accounts`: the wallet's accounts, used by downstream wallet-side
 *     steps (fee estimation via account bridges — not consumed yet).
 *   - `spotPrices`: map of currencyId → counter-value spot price, keyed
 *     the same way as `QuotesInput.sendCurrencyId` /
 *     `receiveCurrencyId`. Used by `normalizeQuote` to emit the
 *     `unrealisticQuote` warning when the quote's output fiat value
 *     exceeds its input fiat value. Callers without spot prices on
 *     hand pass an empty `{}` — the unrealistic check then
 *     short-circuits and no warning is emitted, matching the legacy
 *     "missing prices ⇒ no decision" branch.
 *   - `locale`: BCP 47 tag (e.g. `"en-US"`) used to format
 *     `Quote.formatted` strings (decimal / thousands separators).
 *     Sourced from the wallet's i18n state.
 *   - `counterValueCurrency`: fiat ticker (e.g. `"USD"`) used for the
 *     aggregator's counter-value params, spot-price fetches, and
 *     countervalue strings on `Quote.formatted`. Sourced from the
 *     wallet's counter-value setting.
 */
export type GetQuotesContext = {
  accounts: AccountLike[];
  spotPrices: Record<string, number>;
  locale: string;
  counterValueCurrency: string;
};

/**
 * Fetch + normalize swap quotes for a single wallet-api `getQuotes`
 * invocation. Fans out to the aggregator, joins provider / fee /
 * formatting context, and returns the wire-shaped response ready for
 * the handler to forward to the caller.
 *
 * @param args - Wire-level `getQuotes` arguments (providers, quotes
 *   input, headers, abort signal).
 * @param context - Handler-side dependencies — see
 *   {@link GetQuotesContext}. `locale` + `counterValueCurrency` come
 *   from the wallet's Redux store and drive both the aggregator call
 *   and the `Quote.formatted` strings on each returned quote.
 * @returns The response emitted back to the caller: normalized quotes
 *   (filtered for unsupported pairs) plus the raw aggregator errors.
 */
export async function getQuotes(
  args: GetQuotesArgs,
  context: GetQuotesContext,
): Promise<GetQuotesResponse> {
  const { rawQuotes, errors } = await fetchQuotes(args, context.counterValueCurrency);

  // Drop every successful quote when the pair is on the wallet-side blocklist
  // and skip the provider-data fetch (CAL + CDN) entirely since nothing would
  // be normalized. Aggregator errors still flow through so consumers can
  // surface provider-level failures for the same pair.
  if (isUnsupportedPair(args.data.sendCurrencyId, args.data.receiveCurrencyId)) {
    return { quotes: [], errors };
  }

  // Skip the provider-data fetch (CAL + CDN) and the bridge-side fee-context
  // build (sync + prepareTransaction + getTransactionStatus) when the
  // aggregator returned only error rows — neither result would be consumed
  // by `normalizeQuote`/`computeFeeEstimate`, and forwarding the errors
  // alone keeps the response semantically identical.
  if (rawQuotes.length === 0) {
    return { quotes: [], errors };
  }

  const ledgerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";
  const partnerSignatureEnv = getEnv("MOCK_EXCHANGE_TEST_PARTNER") ? "test" : "prod";

  const [providerData, feeContext] = await Promise.all([
    fetchAndMergeProviderData({ ledgerSignatureEnv, partnerSignatureEnv }),
    fetchNetworkFeeContext({
      accounts: context.accounts,
      fromAccountId: args.data.sendAccountId,
      amountFrom: args.data.amount,
    }),
  ]);

  const normalizationContext = {
    sendCurrencyId: args.data.sendCurrencyId,
    receiveCurrencyId: args.data.receiveCurrencyId,
    spotPrices: context.spotPrices,
  };

  // Resolve once per request: send / receive / fee currency metadata +
  // counter-value fiat do not vary across quotes in a single response.
  const formatContext = buildFormatContext({
    args,
    accounts: context.accounts,
    spotPrices: context.spotPrices,
    feeContext,
    locale: context.locale,
    counterValueCurrency: context.counterValueCurrency,
  });

  const quotes = rawQuotes.map(raw => {
    const feeEstimate = feeContext ? computeFeeEstimate(raw, feeContext) : undefined;
    return normalizeQuote(raw, providerData, normalizationContext, feeEstimate, formatContext);
  });

  return { quotes, errors };
}
