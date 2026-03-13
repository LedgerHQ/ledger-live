import { StableToken } from "@celo/contractkit";

const CELO_STAKE_TOKENS_PAIR: Record<string, StableToken> = {
  cEUR: StableToken.cEUR,
  cREAL: StableToken.cREAL,
  cUSD: StableToken.cUSD,
};

export const CELO_STABLE_TOKENS = Object.keys(CELO_STAKE_TOKENS_PAIR);

export const getStableTokenEnum = (tokenTicker: string): StableToken =>
  CELO_STAKE_TOKENS_PAIR[tokenTicker];

/** Minimum gas for a simple native transfer (EVM standard). */
export const MIN_GAS_FOR_NATIVE_TRANSFER = 21000;

export const MAX_FEES_THRESHOLD_MULTIPLIER = 4;

/**
 * Celo Fee Abstraction — allowlisted fee currencies.
 *
 * Celo's protocol allows users to pay gas in tokens other than the native CELO.
 * The on-chain allowlist is managed by `FeeCurrencyDirectory.sol`.
 *
 * Tokens with fewer than 18 decimals (USDC, USDT) use an **adapter** contract
 * instead of the token address for `feeCurrency`. The adapter normalizes values
 * to 18 decimals so the protocol can price gas consistently. For these tokens:
 *   - `feeCurrency` on the transaction → adapter address
 *   - `contractAddress` (ERC-20 transfer target) → token address
 *
 * Tokens that are natively 18-decimal (cUSD, cEUR, …) do not need an adapter
 * and use their own token address for both purposes.
 * this list contains currently contain tokens that are currenctly allowed to pay fee currency
 *
 * Reference: https://docs.celo.org/protocol/transaction/eip1559
 */
export const FEE_CURRENCY_OPTIONS: {
  name: string;
  contractAddress: `0x${string}` | null;
  adapterAddress: `0x${string}` | null;
}[] = [
  {
    name: "CELO",
    contractAddress: null,
    adapterAddress: null,
  },
  {
    name: "USDT",
    adapterAddress: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72",
    contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  },
  {
    name: "USDC",
    adapterAddress: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
    contractAddress: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  },
] as const;

/** O(1) lookup of fee currency options by contract address. `null` key → native CELO.
 *  Keys are lowercased for case-insensitive matching against token contract addresses. */
export const FEE_CURRENCY_BY_CONTRACT: Map<string | null, (typeof FEE_CURRENCY_OPTIONS)[number]> =
  new Map(
    FEE_CURRENCY_OPTIONS.map(option => [option.contractAddress?.toLowerCase() ?? null, option]),
  );
