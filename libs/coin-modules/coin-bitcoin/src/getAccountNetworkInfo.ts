import flow from "lodash/flow";
import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import { getWalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
const speeds = ["fast", "medium", "slow"];
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
    f => f.filter((f: unknown) => f != null && typeof f === "number"),
    // Normalize values
    f => f.map((f: number) => new BigNumber(f).div(1000).integerValue(BigNumber.ROUND_CEIL)),
    avoidDups,
  ])(rawFees);

  if (feesPerByte.length !== 3) {
    throw new Error("cardinality of feesPerByte should be exactly 3");
  }
  const feeItems = {
    items: feesPerByte.map((feePerByte, i: number) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte: feesPerByte[Math.floor(feesPerByte.length / 2)] || new BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}
