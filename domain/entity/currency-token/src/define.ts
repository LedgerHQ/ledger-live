import { z } from "zod";
import { TokenCurrencySchema, type TokenCurrency } from "./schema";

/**
 * Defines a token currency entity, validating the input against
 * {@link TokenCurrencySchema} and returning a fully-typed domain object.
 *
 * Calling `TokenCurrencySchema.parse()` constructs branded value objects
 * (e.g. `TokenId`, `CurrencyId`) without explicit casts.
 *
 * @example
 * ```ts
 * export const usdtEthereum = token({
 *   type: "TokenCurrency",
 *   id: "ethereum/erc20/usd-tether",
 *   parentCurrencyId: "ethereum",
 *   contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
 *   tokenType: "erc20",
 *   name: "Tether USD",
 *   ticker: "USDT",
 *   units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
 * });
 * ```
 */
export function token(data: z.input<typeof TokenCurrencySchema>): TokenCurrency {
  return TokenCurrencySchema.parse(data);
}
