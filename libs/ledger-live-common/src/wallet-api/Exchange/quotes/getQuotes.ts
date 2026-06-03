import { getEnv } from "@ledgerhq/live-env";
import { getParentAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountLike } from "@ledgerhq/types-live";

import { fetchAndMergeProviderData } from "../../../exchange/providers/swap";
import { getAccountIdFromWalletAccountId, getWalletApiIdFromAccountId } from "../../converters";
import { computeLedgerLiveVersionCompatibilityError } from "./computeLedgerLiveVersionCompatibilityError";
import { computeQuotesErrors } from "./computeQuotesErrors";
import { computeQuotesWarnings } from "./computeQuotesWarnings";
import { fetchNetworkFeeContext } from "./fetchNetworkFeeContext";
import { fetchQuotes } from "./service/fetchQuotes";
import { computeFeeEstimate } from "./normalizer/networkFeeEstimate";
import { buildFormatContext } from "./normalizer/buildFormatContext";
import { normalizeQuote } from "./normalizer";
import {
  QuotesErrorCodes,
  type GetQuotesArgs,
  type GetQuotesResponse,
  type QuotesAppPlatform,
} from "./types";
import { isUnsupportedPair } from "./unsupportedPairs";
import { resolveQuotesInput } from "./resolveQuotesInput";

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
 *     the same way as the resolved send / receive currency ids. Used by
 *     `normalizeQuote` to emit the
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
 *   - `deviceModelId`: optional last-seen device model id. When present,
 *     quote warnings can include device-specific incompatibility signals.
 *   - `appVersion`: optional caller platform/version. When present, quote
 *     errors can include Ledger Live version incompatibility signals.
 *   - `highValueLossThreshold`: optional ratio used to flag quotes whose
 *     receive-side fiat value is below the configured send-side threshold.
 */
export type GetQuotesContext = {
  accounts: AccountLike[];
  spotPrices: Record<string, number>;
  locale: string;
  counterValueCurrency: string;
  deviceModelId?: string;
  appVersion?: {
    platform: QuotesAppPlatform;
    version: string | null;
  };
  highValueLossThreshold?: number;
};

function getParentCurrencyId(accounts: AccountLike[], walletAccountId: string): string | undefined {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  const account =
    (accountId ? accounts.find(acc => acc.id === accountId) : undefined) ??
    accounts.find(acc => getWalletApiIdFromAccountId(acc.id) === walletAccountId);
  return account ? getParentAccount(account, accounts)?.currency.id : undefined;
}

export async function getQuotes(
  args: GetQuotesArgs,
  context: GetQuotesContext,
): Promise<GetQuotesResponse> {
  const quotesInput = resolveQuotesInput(args.data, context.accounts);
  if (!quotesInput) {
    return {
      quotes: [],
      providerErrors: [],
      warnings: [],
      errors: [{ code: QuotesErrorCodes.QUOTE_INPUT_RESOLUTION_FAILED }],
    };
  }

  const resolvedArgs = { ...args, data: quotesInput };
  const sendParentCurrencyId = getParentCurrencyId(context.accounts, args.data.sendAccountId);
  const receiveParentCurrencyId = getParentCurrencyId(context.accounts, args.data.receiveAccountId);
  const deviceModelId = context.deviceModelId;

  const ledgerLiveVersionCompatibilityError = computeLedgerLiveVersionCompatibilityError({
    sendCurrencyId: quotesInput.sendCurrencyId,
    receiveCurrencyId: quotesInput.receiveCurrencyId,
    appVersion: context.appVersion,
  });
  if (ledgerLiveVersionCompatibilityError) {
    return {
      quotes: [],
      providerErrors: [],
      warnings: [],
      errors: [ledgerLiveVersionCompatibilityError],
    };
  }

  const warnings = computeQuotesWarnings({
    deviceModelId,
    sendCurrencyId: quotesInput.sendCurrencyId,
    receiveCurrencyId: quotesInput.receiveCurrencyId,
    sendParentCurrencyId,
    receiveParentCurrencyId,
  });

  const { rawQuotes, providerErrors } = await fetchQuotes(
    resolvedArgs,
    context.counterValueCurrency,
  );

  // Drop every successful quote when the pair is on the wallet-side blocklist
  // and skip the provider-data fetch (CAL + CDN) entirely since nothing would
  // be normalized. Provider rejections still flow through so consumers can
  // surface provider-level failures for the same pair, and the digested
  // global errors are produced from the same inputs as the normal path.
  if (isUnsupportedPair(quotesInput.sendCurrencyId, quotesInput.receiveCurrencyId)) {
    return {
      quotes: [],
      providerErrors,
      warnings,
      errors: computeQuotesErrors({
        successfulQuotesCount: 0,
        providerErrors,
        amountFrom: args.data.amount,
      }),
    };
  }

  if (rawQuotes.length === 0) {
    return {
      quotes: [],
      providerErrors,
      warnings,
      errors: computeQuotesErrors({
        successfulQuotesCount: 0,
        providerErrors,
        amountFrom: args.data.amount,
      }),
    };
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
    sendCurrencyId: quotesInput.sendCurrencyId,
    receiveCurrencyId: quotesInput.receiveCurrencyId,
    sendParentCurrencyId,
    receiveParentCurrencyId,
    deviceModelId,
    highValueLossThreshold: context.highValueLossThreshold,
    spotPrices: context.spotPrices,
  };

  const formatContext = buildFormatContext({
    args: resolvedArgs,
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

  return {
    quotes,
    providerErrors,
    warnings,
    errors: computeQuotesErrors({
      successfulQuotesCount: quotes.length,
      providerErrors,
      amountFrom: args.data.amount,
    }),
  };
}
