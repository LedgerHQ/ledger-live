import type BigNumber from "bignumber.js";

import type { FormattedNumber, FormattedQuoteValues } from "@ledgerhq/wallet-api-exchange-module";

export type { FormattedNumber, FormattedQuoteValues };

/**
 * Minimal per-currency metadata required by {@link formatQuote}. Deliberately
 * narrower than `CryptoCurrency` / `TokenCurrency` from
 * `@ledgerhq/cryptoassets` so the helper stays a pure function and can be
 * driven from fixtures without wallet-wide resolvers in tests.
 *
 * - `id` is the Ledger currency id (e.g. `"ethereum"`, `"ethereum/erc20/usd__coin"`).
 *   Used as the key into {@link FormatQuoteInput.spotPrices}.
 * - `decimals` is the display magnitude (e.g. ETH → 18, USDC → 6). The
 *   formatter caps the rendered decimals at `min(DEFAULT_MAX_DECIMALS, decimals)`
 *   to match the swap-live-app app-config default.
 * - `ticker` is appended as a non-breaking suffix (e.g. "1.23 ETH").
 */
export type CurrencyMeta = {
  id: string;
  decimals: number;
  ticker: string;
};

/**
 * User's preferred counter-value fiat. Deliberately flat so callers can
 * resolve it once (via `findFiatCurrencyByTicker` + `units[0]`) and pass it
 * down; keeping the helper decoupled from `@ledgerhq/cryptoassets` makes
 * parity testing trivial.
 */
export type FiatMeta = {
  ticker: string;
  symbol: string;
  magnitude: number;
};

/**
 * Display-unit numeric inputs + shared context. All numeric values are
 * already in their "human" units: `sendAmount`, `receiveAmount`,
 * `exchangeRate`, and `networkFeeAmount` are NOT atomic. The orchestrator
 * (normalizer) is responsible for dividing the atomic fee estimate by the
 * fee currency magnitude before calling `formatQuote`.
 */
export type FormatQuoteInput = {
  quote: {
    /**
     * Surfaced to consumers as-is so they can decide how to decorate
     * the receive amount (e.g. prefixing with `~`); the formatter does
     * not apply any marker on its own.
     */
    type: "float" | "fixed";
    sendAmount: number | string | BigNumber;
    receiveAmount: number | string | BigNumber;
    exchangeRate: number | string | BigNumber;
    /** Already-normalized slippage (see `normalizeSlippage`). */
    slippage: number;
    /**
     * Currency id used to look up the spot price for
     * {@link FormattedQuoteValues.networkFeeCountervalue}. Mirrors swap's
     * `quote.quoteDetails.networkFees.currencyId`.
     */
    networkFeesCurrencyId: string;
  };
  /** Network fee in display units (BigNumber for precision on 18-decimal chains). */
  networkFeeAmount: BigNumber;
  sendCurrency?: CurrencyMeta;
  receiveCurrency?: CurrencyMeta;
  networkFeesCurrency?: CurrencyMeta;
  fiat: FiatMeta;
  /** Map of Ledger currency id → spot price in {@link FiatMeta.ticker}. */
  spotPrices: Record<string, number>;
  /** BCP 47 locale tag (e.g. `"en"`, `"fr-FR"`). Defaults to `"en"` if omitted. */
  locale: string;
};

/**
 * Shared context threaded through {@link normalizeQuote} when the caller
 * has enough wallet-side state to produce {@link FormattedQuoteValues}.
 *
 * Built once per `getQuotes` call (not per quote) because the send /
 * receive / fee currencies and the user's counter-value fiat do not vary
 * across the quotes in a single response.
 */
export type FormatContext = {
  locale: string;
  fiat: FiatMeta;
  /** Same map used for the `unrealisticQuote` warning, keyed by currency id. */
  spotPrices: Record<string, number>;
  sendCurrency?: CurrencyMeta;
  receiveCurrency?: CurrencyMeta;
  networkFeesCurrency?: CurrencyMeta;
};
