import { BigNumber } from "bignumber.js";
import type { Explorer } from "../network/explorer";
import type { ExplorerFees, ExplorerNetwork } from "../network/types";
import { BitcoinInfrastructureError } from "../errors";

export type FeeRates = {
  slow: BigNumber;
  medium: BigNumber;
  fast: BigNumber;
  /** Minimum relay fee rate (sat/vB). */
  relay: BigNumber;
  /** Incremental relay fee rate (sat/vB), the minimum bump of a replacement. */
  incremental: BigNumber | undefined;
};

/** BTC/kB → sat/vB, rounded up so it never falls under the node floor. */
const btcPerKbToSatPerVb = (btcPerKb: string): BigNumber =>
  new BigNumber(btcPerKb).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);

const toRate = (value: string | null | undefined): BigNumber | undefined => {
  if (value === undefined || value === null) return undefined;
  const rate = btcPerKbToSatPerVb(value);
  return rate.isFinite() && rate.gte(0) ? rate : undefined;
};

/** Keeps every level strictly above the next one, in [fast, medium, slow] order. */
export function avoidDups(nums: BigNumber[]): BigNumber[] {
  const out = nums.slice(0);
  for (let i = out.length - 2; i >= 0; i--) {
    if (out[i + 1].gte(out[i])) {
      out[i] = out[i + 1].plus(1);
    }
  }
  return out;
}

/** Clamps a level to at least the floor plus one sat/vB, as an integer. */
export const clamp =
  (floor: BigNumber, epsilon: BigNumber = new BigNumber(1)) =>
  (rate: BigNumber): BigNumber =>
    BigNumber.max(rate, floor.plus(epsilon)).integerValue(BigNumber.ROUND_CEIL);

/**
 * Converts the explorer presets — `{ "2": 2435, "3": 1241, "6": 1009, "last_updated": … }` in sat/kB
 * — to [fast, medium, slow] in sat/vB, kept strictly above the relay floor.
 */
export function feeRatesFrom(
  currencyId: string,
  fees: ExplorerFees,
  networkInfo: ExplorerNetwork | undefined,
): FeeRates {
  // No relay fee from the node (or an unreadable one): no floor, as wallet-btc's getRelayFeeFloorSatVb
  const relayRate = toRate(networkInfo?.relay_fee);
  const floor = relayRate === undefined ? new BigNumber(0) : BigNumber.max(relayRate, 1);

  const rates = avoidDups(
    Object.entries(fees)
      .filter(([key, value]) => !Number.isNaN(Number(key)) && typeof value === "number")
      .map(([, value]) => new BigNumber(value).div(1000).integerValue(BigNumber.ROUND_CEIL)),
  );
  if (rates.length !== 3) {
    throw new BitcoinInfrastructureError();
  }
  const [fast, medium, slow] = avoidDups(rates.map(clamp(floor)));

  return {
    fast,
    medium,
    slow,
    // BTC enforces a 1 sat/vB floor (Bitcoin Core minrelaytxfee default); other coins use the node value
    relay: currencyId === "bitcoin" ? BigNumber.max(floor, 1) : floor,
    incremental: toRate(networkInfo?.incremental_fee),
  };
}

async function fetchFeeRates(currencyId: string, explorer: Explorer): Promise<FeeRates> {
  const [fees, networkInfo] = await Promise.all([
    explorer.getFees(),
    explorer.getNetwork().catch(() => undefined),
  ]);
  return feeRatesFrom(currencyId, fees, networkInfo);
}

const feeRatesCache = new Map<string, { expiresAt: number; rates: Promise<FeeRates> }>();

/**
 * The fee rates of the currency, read once per explorer for `explorer.feeRatesCacheTtlMs` (the coin
 * config's `fees.feeRatesCacheTtlMs`). A failed read is not kept.
 */
export function getFeeRates(currencyId: string, explorer: Explorer): Promise<FeeRates> {
  const key = `${currencyId}:${explorer.baseUrl}`;
  const now = Date.now();
  const cached = feeRatesCache.get(key);
  if (cached && cached.expiresAt > now) return cached.rates;
  const rates = fetchFeeRates(currencyId, explorer);
  const entry = { expiresAt: now + explorer.feeRatesCacheTtlMs, rates };
  feeRatesCache.set(key, entry);
  rates.catch(() => {
    if (feeRatesCache.get(key) === entry) feeRatesCache.delete(key);
  });
  return rates;
}

const toBigNumber = (value: unknown): BigNumber | undefined => {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    return undefined;
  }
  const n = new BigNumber(value.toString());
  return n.isFinite() ? n : undefined;
};

/**
 * The fee rate to price a transaction with: an explicit rate (custom fees) wins over the strategy,
 * which defaults to "medium" as the legacy bridge did — including a "custom" strategy whose rate
 * has not been typed yet.
 */
export function resolveFeePerByte(
  rates: FeeRates,
  { feePerByte, feesStrategy }: { feePerByte?: unknown; feesStrategy?: unknown },
): BigNumber {
  const explicit = toBigNumber(feePerByte);
  if (explicit !== undefined) return explicit;
  switch (feesStrategy) {
    case "slow":
      return rates.slow;
    case "fast":
      return rates.fast;
    default:
      return rates.medium;
  }
}
