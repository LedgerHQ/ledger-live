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
