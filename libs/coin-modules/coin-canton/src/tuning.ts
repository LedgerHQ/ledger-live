import BigNumber from "bignumber.js";
import type { CantonCoinConfig } from "./config";
import { DEFAULT_MAX_TX_QUERY, DEFAULT_MIN_RESERVE, GATEWAY_MAX_TX_QUERY } from "./constants";

/** Returns the coin-config override when it is an integer of at least `min`, otherwise the default. */
export function tuning(value: unknown, fallback: number, min = 0): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min ? value : fallback;
}

export const getMaxTxQuery = (config: CantonCoinConfig): number =>
  Math.min(tuning(config.gateway?.maxTxQuery, DEFAULT_MAX_TX_QUERY, 1), GATEWAY_MAX_TX_QUERY);

/**
 * The reserve kept out of the spendable balance, exact beyond 2^53. A numeric string is read as its
 * number; a non-finite or negative override reads as the default.
 */
export const getMinReserve = (config: CantonCoinConfig): BigNumber => {
  const minReserve = new BigNumber(config.minReserve ?? DEFAULT_MIN_RESERVE);
  return minReserve.isFinite() && minReserve.gte(0)
    ? minReserve
    : new BigNumber(DEFAULT_MIN_RESERVE);
};
