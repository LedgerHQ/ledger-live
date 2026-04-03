import { TokenIdSchema, CurrencyIdSchema } from "@shared/schema-primitives";
import type { TokenCurrency } from "./schema";

/**
 * Returns a valid {@link TokenCurrency} fixture (USDT on Ethereum, ERC-20).
 * Pass `overrides` to customise individual fields for a specific test.
 */
export function mockTokenCurrency(overrides?: Partial<TokenCurrency>): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: TokenIdSchema.parse("ethereum/erc20/usd-tether"),
    parentCurrencyId: CurrencyIdSchema.parse("ethereum"),
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tokenType: "erc20",
    name: "Tether USD",
    ticker: "USDT",
    units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
    ...overrides,
  };
}
