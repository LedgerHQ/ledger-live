import type { FeesStrategy } from "@ledgerhq/coin-module-framework/api/types";
import { BigNumber } from "bignumber.js";
import type { BitcoinCoinConfig } from "../config";
import { BitcoinInfrastructureError } from "../errors";
import { fetchFeeRates, fetchNetworkInfo } from "../network/explorer";
import type { ExplorerFees } from "../network/types";
import { toBigInt } from "./feeParameters";

export type FeeRate = {
  /** Fee rate applied to the transaction, in sat/vB. */
  feePerByte: bigint;
  /** Minimum relay fee rate of the network, in sat/vB (never below 1). */
  relayFeePerByte: bigint;
};

/**
 * The speeds of the explorer's three rates, in their order. `custom` is not one: it takes the
 * caller's rate and never reads the explorer's (see `getFeeRate`).
 */
const EXPLORER_SPEEDS: FeesStrategy[] = ["fast", "medium", "slow"];

/** Each rate above the next one, from fast to slow, raising a rate where it is not (`avoidDups`). */
function strictlyDecreasing(rates: bigint[]): bigint[] {
  const result = [...rates];
  for (let i = result.length - 2; i >= 0; i--) {
    if (result[i + 1] >= result[i]) result[i] = result[i + 1] + 1n;
  }
  return result;
}

/**
 * The fast, medium and slow rates, in sat/vB, read as the bridge reads them
 * (`getAccountNetworkInfo`):
 *
 * - The explorer publishes sat/kB rates keyed by confirmation target, plus `last_updated`. The
 *   targets are integer keys, which JavaScript enumerates in ascending order: fast, medium, slow.
 *   `last_updated` and any non-numeric rate are left out.
 * - Each rate is converted to sat/vB, rounded up, and made strictly greater than the slower one.
 * - Each is then raised to at least the relay floor + 1 sat/vB, and made strictly decreasing again.
 *
 * Anything but three rates is an explorer failure (`BitcoinInfrastructureError`), as for the bridge.
 */
function explorerRates(fees: ExplorerFees, relayFee: string | null | undefined): bigint[] {
  const rates = Object.entries(fees)
    .filter(([target]) => !Number.isNaN(Number(target)))
    .map(([, rate]) => rate)
    .filter((rate): rate is number => typeof rate === "number")
    .map(rate => BigInt(Math.ceil(rate / 1000)));
  if (rates.length !== EXPLORER_SPEEDS.length) throw new BitcoinInfrastructureError();
  // wallet-btc `getRelayFeeFloorSatVb`: the relay fee, never below 1 sat/vB; 0 when unknown.
  const floor = relayFee ? BigNumber.max(new BigNumber(relayFee).times(1e8).div(1000), 1) : 0;
  const threshold = BigInt(
    new BigNumber(floor).plus(1).integerValue(BigNumber.ROUND_CEIL).toFixed(),
  );
  return strictlyDecreasing(
    strictlyDecreasing(rates).map(rate => (rate > threshold ? rate : threshold)),
  );
}

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
 *   the estimate shown meanwhile. A rate below the relay minimum is reported by `validateIntent`.
 * - `fast` | `medium` | `slow` (default `medium`): `feePerByte` when the caller passes one, floored
 *   at the relay rate; otherwise the explorer's rate for that speed, read as the bridge reads it
 *   (see `explorerRates`).
 */
export async function getFeeRate(
  config: BitcoinCoinConfig,
  options: { feePerByte?: unknown; feesStrategy?: unknown } = {},
): Promise<FeeRate> {
  const custom = options.feesStrategy === "custom";
  const [rates, network] = await Promise.all([
    custom || options.feePerByte !== undefined ? undefined : fetchFeeRates(config),
    fetchNetworkInfo(config),
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
    const index = EXPLORER_SPEEDS.indexOf(strategy as FeesStrategy);
    if (index < 0) {
      const shown = typeof strategy === "string" ? strategy : JSON.stringify(strategy);
      throw new Error(`unknown fees strategy: ${shown}`);
    }
    feePerByte = explorerRates(rates ?? {}, network.relay_fee)[index];
  }

  return {
    feePerByte: feePerByte > relayFeePerByte ? feePerByte : relayFeePerByte,
    relayFeePerByte,
  };
}
