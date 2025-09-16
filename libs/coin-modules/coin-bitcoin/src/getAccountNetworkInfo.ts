import flow from "lodash/flow";
import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import { getWalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
import { BitcoinInfrastructureError } from "./errors";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
const speeds = ["fast", "medium", "slow"];
//
// // --- Fee floor helpers (sat/vB) ---
// // Fallbacks; later you can replace with Atlas `/network` (minrelay/mempoolMin).
// const MIN_RELAY_FLOOR_SAT_VB: Record<string, number> = {
//   bitcoin: 1,
//   bitcoin_testnet: 1,
// };
//
// function getMinRelayFloorSatVb(currency: CryptoCurrency): BigNumber {
//   return new BigNumber(MIN_RELAY_FLOOR_SAT_VB[currency.id] ?? 1);
// }

// --- Helpers: BTC/kB → sat/vB and clamping ---
function btcPerKbToSatPerVB(btcPerKbStr: string): BigNumber {
  // sat/vB = BTC/kB * 1e8 (sat/BTC) / 1000 (vB/kB); ceil to avoid under-floor
  return new BigNumber(btcPerKbStr).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);
}

// Clamp each level to ≥ floor + ε and return integers
export function clampFeesToFloor(
  fees: BigNumber[],
  floor: BigNumber,
  epsilon: BigNumber = new BigNumber(1), // +1 sat/vB safety
): BigNumber[] {
  return fees.map(f => BigNumber.max(f, floor.plus(epsilon)).integerValue(BigNumber.ROUND_CEIL));
}

export function avoidDups(nums: Array<BigNumber>): Array<BigNumber> {
  nums = nums.slice(0);

  for (let i = nums.length - 2; i >= 0; i--) {
    if (nums[i + 1].gte(nums[i])) {
      nums[i] = nums[i + 1].plus(1);
    }
  }

  return nums;
}
export async function getAccountNetworkInfo(account: Account): Promise<NetworkInfo> {
  const walletAccount = getWalletAccount(account);
  const rawFees = await walletAccount.xpub.explorer.getFees();
  //
  // Try dynamic relay floor from explorer.getNetwork(); fallback to 1 sat/vB.
  let floorSatPerVB = new BigNumber(1);
  try {
    const explorerAny = walletAccount.xpub.explorer as any;
    if (typeof explorerAny.getNetwork === "function") {
      const net = await explorerAny.getNetwork();
      if (net?.relay_fee) {
        const rel = btcPerKbToSatPerVB(net.relay_fee);
        if (rel.isFinite() && rel.gte(0)) {
          // Keep at least 1 sat/vB; we can later also take max(rel, mempoolMin)
          floorSatPerVB = BigNumber.max(rel, 1);
        }
      }
    }
  } catch {
    // ignore network failures; keep default floor = 1
  }

  // Convoluted logic to convert from:
  // { "2": 2435, "3": 1241, "6": 1009, "last_updated": 1627973170 }
  // to:
  // { 2435, 1241, 1009 }
  const feesPerByte: BigNumber[] = flow([
    // Remove the 'last_updated' key
    Object.entries,
    entries => entries.filter(([key]: [string]) => !isNaN(Number(key))),
    // Reconstruct the array with only the values
    Object.fromEntries,
    Object.values,
    // Safety against invalid data
    f => f.filter((f: unknown) => typeof f === "number"),
    // Normalize values
    f => f.map((f: number) => new BigNumber(f).div(1000).integerValue(BigNumber.ROUND_CEIL)),
    avoidDups,
  ])(rawFees);

  if (feesPerByte.length !== 3) {
    throw new BitcoinInfrastructureError();
  }

  // --- Enforce network floor (+1 sat/vB safety) and preserve strict ordering ---
  // const minRelayFloor = getMinRelayFloorSatVb(account.currency);
  // let clamped = clampFeesToFloor(feesPerByte, minRelayFloor);

  // --- Enforce dynamic floor (+1 sat/vB safety) and preserve strict ordering ---
  let clamped = clampFeesToFloor(feesPerByte, floorSatPerVB);
  clamped = avoidDups(clamped);

  const feeItems = {
    // items: feesPerByte.map((feePerByte, i: number) => ({
    items: clamped.map((feePerByte, i: number) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    // defaultFeePerByte: clamped[Math.floor(clamped.length / 2)] || new BigNumber(0),
    // defaultFeePerByte: feesPerByte[Math.floor(feesPerByte.length / 2)] || new BigNumber(0),
    defaultFeePerByte: clamped[Math.floor(clamped.length / 2)] || new BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}
