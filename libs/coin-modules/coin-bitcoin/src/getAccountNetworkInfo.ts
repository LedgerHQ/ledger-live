import flow from "lodash/flow";
import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import { getWalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
import { BitcoinInfrastructureError } from "./errors";
import { getRelayFeeFloorSatVb } from "./wallet-btc/utils";
const speeds = ["fast", "medium", "slow"];

// Clamp each level to ≥ floor + ε and return integers
export function clamp(
  floor: BigNumber,
  epsilon: BigNumber = new BigNumber(1), // +1 sat/vB safety
): (f: BigNumber) => BigNumber {
  const threshold = floor.plus(epsilon);
  return (f: BigNumber) => BigNumber.max(f, threshold).integerValue(BigNumber.ROUND_CEIL);
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
  const floorSatPerVB = await getRelayFeeFloorSatVb(walletAccount.xpub.explorer);

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

  // --- Enforce dynamic floor and preserve strict ordering ---
  let clamped = feesPerByte.map(clamp(floorSatPerVB));
  clamped = avoidDups(clamped);

  const feeItems = {
    items: clamped.map((feePerByte, i: number) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte: clamped[Math.floor(clamped.length / 2)] || new BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}
