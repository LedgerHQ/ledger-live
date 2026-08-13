import { z } from "zod";
import { CryptoCurrencyIdSchema, CryptoCurrencySchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, TokenCurrencySchema } from "@domain/entity-currency-token";
import { FiatCurrencySchema } from "@domain/entity-currency-fiat";

/**
 * The id of a crypto or a token currency — `"ethereum"` or `"ethereum/erc20/usd_tether"`.
 *
 * Lives here rather than beside each consumer because callers that key data by currency accept
 * both kinds, and asserting only the crypto form would reject every token id.
 */
export const CryptoOrTokenCurrencyIdSchema = z.union([
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
]);

/** A crypto or token currency id, inferred from {@link CryptoOrTokenCurrencyIdSchema}. */
export type CryptoOrTokenCurrencyId = z.infer<typeof CryptoOrTokenCurrencyIdSchema>;

/**
 * Discriminated union of {@link CryptoCurrency} and {@link TokenCurrency}.
 * Use when handling on-chain currencies (no fiat).
 */
export const CryptoOrTokenCurrencySchema = z.discriminatedUnion("type", [
  CryptoCurrencySchema,
  TokenCurrencySchema,
]);

/** A crypto or token currency, inferred from {@link CryptoOrTokenCurrencySchema}. */
export type CryptoOrTokenCurrency = z.infer<typeof CryptoOrTokenCurrencySchema>;

/**
 * Discriminated union of all currency kinds: {@link CryptoCurrency},
 * {@link TokenCurrency}, and {@link FiatCurrency}.
 */
export const CurrencySchema = z.discriminatedUnion("type", [
  CryptoCurrencySchema,
  TokenCurrencySchema,
  FiatCurrencySchema,
]);

/** Any currency — crypto, token, or fiat. Inferred from {@link CurrencySchema}. */
export type Currency = z.infer<typeof CurrencySchema>;
