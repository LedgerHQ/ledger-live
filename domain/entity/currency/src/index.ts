import { z } from "zod";
import { CryptoCurrencySchema } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { FiatCurrencySchema } from "@domain/entity-currency-fiat";

// Re-export everything from the three currency entity packages and unit
export * from "@domain/entity-unit";
export * from "@domain/entity-currency-crypto";
export * from "@domain/entity-currency-token";
export * from "@domain/entity-currency-fiat";

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
