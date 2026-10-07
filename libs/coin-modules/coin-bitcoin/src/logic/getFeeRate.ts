import { BigNumber } from "bignumber.js";
import type { BitcoinCoinConfig } from "../config";
import { fetchFeeRates, fetchNetworkInfo } from "../network/explorer";
import { toBigInt } from "./normalize";

export type FeesStrategy = "fast" | "medium" | "slow" | "custom";

export type FeeRate = {
  /** Fee rate applied to the transaction, in sat/vB. */
  feePerByte: bigint;
  /** Minimum relay fee rate of the network, in sat/vB (never below 1). */
  relayFeePerByte: bigint;
};

/**
 * The speeds read from the explorer's rates, in their order once sorted by confirmation target.
 * `custom` is not one: it takes the caller's rate and never reads the explorer's (see `getFeeRate`).
 */
const EXPLORER_SPEEDS: FeesStrategy[] = ["fast", "medium", "slow"];

/** BTC/kB (decimal string) to sat/vB, rounded up, never below 1. */
function relayFloor(relayFee: string | null | undefined): bigint {
  if (!relayFee) return 1n;
  const satPerVb = new BigNumber(relayFee).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);
  if (!satPerVb.isFinite() || satPerVb.lt(1)) return 1n;
  return BigInt(satPerVb.toFixed());
}

function positiveRate(feePerByte: unknown): bigint {
  const rate = toBigInt(feePerByte, "feePerByte");
  if (rate <= 0n) throw new Error("feePerByte must be positive");
  return rate;
}

/**
 * Fee rate of a transaction, in sat/vB, by `feesStrategy` (the generic bridge's key):
 *
 * - `custom`: the caller's rate, as coin-evm uses the caller's gas price. The explorer's rates are
 *   not read and the rate is not raised: `feePerByte` as given, or, when the caller imposes an
 *   absolute fee instead (`customFees.value`), the network's minimum relay rate, which only prices
 *   the estimate shown meanwhile. A rate below the relay minimum is refused when crafting.
 * - `fast` | `medium` | `slow` (default `medium`): `feePerByte` when the caller passes one, otherwise
 *   the explorer's rate for that speed. The explorer publishes sat/kB rates keyed by confirmation
 *   target; ordered by target, they are the fast, medium and slow rates, converted to sat/vB rounded
 *   up (same reading as the bridge's `getAccountNetworkInfo`). Either is floored at the relay rate.
 */
export async function getFeeRate(
  config: BitcoinCoinConfig,
  currencyId: string,
  options: { feePerByte?: unknown; feesStrategy?: unknown } = {},
): Promise<FeeRate> {
  const custom = options.feesStrategy === "custom";
  const [rates, network] = await Promise.all([
    custom || options.feePerByte !== undefined ? undefined : fetchFeeRates(config, currencyId),
    fetchNetworkInfo(config, currencyId),
  ]);
  const relayFeePerByte = relayFloor(network.relay_fee);

  if (custom) {
    return {
      feePerByte:
        options.feePerByte === undefined ? relayFeePerByte : positiveRate(options.feePerByte),
      relayFeePerByte,
    };
  }

  let feePerByte: bigint;
  if (options.feePerByte !== undefined) {
    feePerByte = positiveRate(options.feePerByte);
  } else {
    const strategy = options.feesStrategy ?? "medium";
    const index = EXPLORER_SPEEDS.findIndex(speed => speed === strategy);
    if (index < 0) throw new Error(`unknown fees strategy: ${String(strategy)}`);
    const byTarget = Object.entries(rates ?? {})
      .filter(([target, rate]) => !isNaN(Number(target)) && typeof rate === "number")
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, rate]) => BigInt(Math.ceil(rate / 1000)));
    if (byTarget.length === 0) throw new Error("explorer returned no fee rates");
    feePerByte = byTarget[Math.min(index, byTarget.length - 1)];
  }

  return {
    feePerByte: feePerByte > relayFeePerByte ? feePerByte : relayFeePerByte,
    relayFeePerByte,
  };
}
