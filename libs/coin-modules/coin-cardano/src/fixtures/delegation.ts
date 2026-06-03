import BigNumber from "bignumber.js";
import type { CardanoDelegation } from "../types";

// A mainnet base address — carries a stake credential, so staking flows apply.
export const STAKING_ADDRESS =
  "addr1q8mgw8geggkl2hs0m6rq3pgt69uxttpqcgu6euxje5tt6plxjtjrnskhhtt03g6l3sr98p9t8mtlajr26vmwjzep77pqxn8cms";

export function getDelegationFixture(over: Partial<CardanoDelegation> = {}): CardanoDelegation {
  return {
    status: true,
    deposit: "2000000",
    poolId: "pool1xyz",
    ticker: "TICK",
    name: "Pool",
    dRepHex: undefined,
    rewards: new BigNumber(0),
    ...over,
  };
}
