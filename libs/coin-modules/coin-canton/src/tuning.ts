import BigNumber from "bignumber.js";
import type { CantonCoinConfig } from "./config";
import { GATEWAY_MAX_TX_QUERY } from "./constants";
import { CantonInvalidConfigError } from "./types/errors";

function integer(field: string, value: unknown, min: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= min) return value;
  throw new CantonInvalidConfigError(
    `canton: coin config ${field} must be an integer >= ${min}, got ${String(value)}`,
  );
}

/** For a TTL or a page size: zero would cache without expiry or request nothing. */
export const positiveInt = (field: string, value: unknown): number => integer(field, value, 1);

/** For an endpoint or an id: a missing one would build a request to the wrong place. */
export function nonEmptyString(field: string, value: unknown): string {
  if (typeof value === "string" && value !== "") return value;
  throw new CantonInvalidConfigError(
    `canton: coin config ${field} must be a non-empty string, got ${String(value)}`,
  );
}

/** For a feature switch: a remote `"false"` or `1` must not read as on. */
export function boolean(field: string, value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new CantonInvalidConfigError(
    `canton: coin config ${field} must be a boolean, got ${String(value)}`,
  );
}

export const getMaxTxQuery = (config: CantonCoinConfig): number =>
  Math.min(positiveInt("gateway.maxTxQuery", config.gateway?.maxTxQuery), GATEWAY_MAX_TX_QUERY);

/**
 * The reserve kept out of the spendable balance, exact beyond 2^53. A numeric string is read as its
 * number; a missing, non-integer or negative value throws.
 */
export const getMinReserve = (config: CantonCoinConfig): BigNumber => {
  const minReserve = new BigNumber(config.minReserve);
  if (minReserve.isFinite() && minReserve.isInteger() && minReserve.gte(0)) return minReserve;
  throw new CantonInvalidConfigError(
    `canton: coin config minReserve must be an integer >= 0, got ${String(config.minReserve)}`,
  );
};
