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

export const FEE_CURRENCIES: Record<
  string,
  { name: string; token: string; adapter: string; decimals: number }
> = {
  // Mainnet USDC
  "0xceba9300f2b948710d2653dd7b07f33a8b32118c": {
    name: "USDC",
    token: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    adapter: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
    decimals: 6,
  },
  // Mainnet USDT
  "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": {
    name: "USDT",
    token: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    adapter: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72",
    decimals: 6,
  },
};
