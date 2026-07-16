import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ApiTokenData } from "../converter";
import type { ApiTokenResponse } from "../types";

// Shared test fixtures. Not re-exported from the package barrel; imported only by `*.test.ts`.

/** Canonical CAL `/v1/tokens` response entry (USDC on Ethereum). */
export const mockApiTokenResponse: ApiTokenResponse = {
  id: "ethereum/erc20/usd_coin",
  contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
  standard: "erc20",
  decimals: 6,
  delisted: false,
  live_signature: "3045022100...",
};

/** The {@link TokenCurrency} that {@link mockApiTokenResponse} converts to. */
export const mockTokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrencyId: "ethereum",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
} as TokenCurrency;

/** Builds an {@link ApiTokenData} converter input with ERC-20/USDC defaults; override per case. */
export function buildApiTokenData(overrides: Partial<ApiTokenData> = {}): ApiTokenData {
  return {
    id: "ethereum/erc20/usdc",
    contractAddress: "0xA0b86",
    name: "USD Coin",
    ticker: "USDC",
    units: [{ code: "USDC", name: "USD Coin", magnitude: 6 }],
    standard: "erc20",
    ...overrides,
  };
}
