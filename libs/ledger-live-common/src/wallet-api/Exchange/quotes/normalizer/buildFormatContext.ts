import type { AccountLike } from "@ledgerhq/types-live";

import { findCryptoCurrencyById, findFiatCurrencyByTicker } from "../../../../currencies";
import { getAccountIdFromWalletAccountId } from "../../../converters";
import type { CurrencyMeta, FiatMeta, FormatContext } from "../format/types";
import type { GetQuotesArgs } from "../types";
import type { NetworkFeeContext } from "./networkFeeEstimate";

/**
 * Resolve the crypto currency metadata for a wallet-api account id.
 * Distinguishes `TokenAccount` from regular accounts so token swaps pick
 * up the token's own decimals + ticker, not the parent chain's.
 *
 * @param accounts - Wallet accounts supplied by the handler context.
 * @param walletAccountId - UUID-shaped id from `QuotesInput`.
 * @returns The account's currency meta, or `undefined` when the account
 *   or its display unit cannot be found — `formatQuote` then falls back
 *   to its no-ticker / `DEFAULT_MAX_DECIMALS` branch.
 */
function resolveCurrencyMetaFromAccount(
  accounts: AccountLike[],
  walletAccountId: string,
): CurrencyMeta | undefined {
  const realAccountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!realAccountId) {
    return undefined;
  }
  const account = accounts.find(acc => acc.id === realAccountId);
  if (!account) {
    return undefined;
  }

  const source = account.type === "TokenAccount" ? account.token : account.currency;
  const unit = source.units[0];
  if (!unit) {
    return undefined;
  }

  return {
    id: source.id,
    decimals: unit.magnitude,
    ticker: source.ticker,
  };
}

/**
 * Derive the fee currency metadata from the {@link NetworkFeeContext}.
 * Fees are always paid in the parent chain's native currency, so the
 * synchronous `findCryptoCurrencyById` suffices (no CAL roundtrip).
 *
 * @param feeContext - Context built once per request by `fetchNetworkFeeContext`.
 * @returns The fee currency meta, or `undefined` when the bridge
 *   produced no context or the currency id is unknown.
 */
function resolveFeeCurrencyMeta(
  feeContext: NetworkFeeContext | null | undefined,
): CurrencyMeta | undefined {
  if (!feeContext) {
    return undefined;
  }
  const currency = findCryptoCurrencyById(feeContext.feeCurrencyId);
  if (!currency) {
    return undefined;
  }
  return {
    id: feeContext.feeCurrencyId,
    decimals: feeContext.feeCurrencyMagnitude,
    ticker: currency.ticker,
  };
}

/**
 * Resolve the user's counter-value fiat, mirroring swap-live-app's
 * `getCurrencyByTicker(userSetting.toUpperCase())` lookup.
 *
 * @param ticker - Fiat ticker (`"USD"`, `"eur"`, …), case-insensitive.
 * @returns The fiat meta, or `undefined` when the ticker does not
 *   resolve to a known fiat. The `symbol` slot falls back to the ticker
 *   itself when the registry entry omits one.
 */
function resolveFiatMeta(ticker: string): FiatMeta | undefined {
  const fiat = findFiatCurrencyByTicker(ticker.toUpperCase());
  if (!fiat) {
    return undefined;
  }
  const unit = fiat.units[0];
  if (!unit) {
    return undefined;
  }
  return {
    ticker: fiat.ticker,
    symbol: fiat.symbol ?? fiat.ticker,
    magnitude: unit.magnitude,
  };
}

/**
 * Build the wallet-side {@link FormatContext} for a `getQuotes` call.
 * Called once per request because send / receive / fee currencies and
 * the counter-value fiat do not vary across the quotes in a single
 * response.
 *
 * @param params.args - The wire-level `getQuotes` request (used to pick
 *   send / receive account ids).
 * @param params.accounts - Wallet accounts from the handler context.
 * @param params.spotPrices - Pre-fetched spot prices keyed by currency id.
 * @param params.feeContext - Fee-estimation context from
 *   `fetchNetworkFeeContext` (nullable on bridge failure).
 * @param params.locale - BCP 47 locale from the wallet's i18n state.
 * @param params.counterValueCurrency - Fiat ticker from the wallet's
 *   counter-value setting (case-insensitive).
 * @returns A fully-populated `FormatContext`, or `undefined` when either
 *   the locale / counter-value is missing or the counter-value ticker
 *   does not resolve — the normalizer then skips `Quote.formatted` and
 *   consumers fall back to their own pipeline.
 */
export function buildFormatContext(params: {
  args: GetQuotesArgs;
  accounts: AccountLike[];
  spotPrices: Record<string, number>;
  feeContext: NetworkFeeContext | null | undefined;
  locale?: string;
  counterValueCurrency?: string;
}): FormatContext | undefined {
  const { args, accounts, spotPrices, feeContext, locale, counterValueCurrency } = params;

  if (!locale || !counterValueCurrency) {
    return undefined;
  }

  const fiat = resolveFiatMeta(counterValueCurrency);
  if (!fiat) {
    return undefined;
  }

  return {
    locale,
    fiat,
    spotPrices,
    sendCurrency: resolveCurrencyMetaFromAccount(accounts, args.data.sendAccountId),
    receiveCurrency: resolveCurrencyMetaFromAccount(accounts, args.data.receiveAccountId),
    networkFeesCurrency: resolveFeeCurrencyMeta(feeContext),
  };
}
