import { z } from "zod";
import { CryptoCurrencyIdSchema, CryptoCurrencySchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, TokenCurrencySchema } from "@domain/entity-currency-token";
import { FiatCurrencySchema } from "@domain/entity-currency-fiat";

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
 * Id of a {@link CryptoOrTokenCurrency}: a crypto currency id or a token id.
 * Compared as a string: the two id brands share one runtime schema.
 */
export const CryptoOrTokenCurrencyIdSchema = z.union([
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
]);

/** A crypto or token currency id, inferred from {@link CryptoOrTokenCurrencyIdSchema}. */
export type CryptoOrTokenCurrencyId = z.infer<typeof CryptoOrTokenCurrencyIdSchema>;

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
