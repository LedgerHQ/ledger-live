import flow from "lodash/flow";
import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { NetworkInfo } from "./types";
import { getWalletAccount } from "./wallet-btc";
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
export async function getAccountNetworkInfo(
  account: Account
): Promise<NetworkInfo> {
  const walletAccount = getWalletAccount(account);
  const rawFees = await walletAccount.xpub.explorer.getFees();
  const relayFee = await walletAccount.xpub.explorer.getRelayFee();
  // Convoluted logic to convert from:
  // { "2": 2435, "3": 1241, "6": 1009, "last_updated": 1627973170 }
  // to:
  // { 2435, 1241, 1009 }
  const feesPerByte = flow([
    // Remove the 'last_updated' key
    Object.entries,
    (entries) => entries.filter(([key]) => !isNaN(key)),
    // Reconstruct the array with only the values
    Object.fromEntries,
    Object.values,
    // Safety against invalid data
    (f) => f.filter((f) => f != null && typeof f === "number"),
    // Normalize values
    (f) =>
      f.map((f) =>
        new BigNumber(f).div(1000).integerValue(BigNumber.ROUND_CEIL)
      ),
    avoidDups,
  ])(rawFees);

  if (feesPerByte.length !== 3) {
    throw new Error("cardinality of feesPerByte should be exactly 3");
  }
  // Fix fees if suggested fee is too low, this is only for viacoin/decred because the fees backend endpoint is broken
  if (
    (account.currency.id === "viacoin" ||
      account.currency.id === "decred" ||
      account.currency.id === "qtum") &&
    feesPerByte[2].toNumber() < Math.ceil(relayFee * 100000)
  ) {
    feesPerByte[2] = new BigNumber(Math.ceil(relayFee * 100000)).plus(2);
    feesPerByte[1] = feesPerByte[2].plus(1);
    if (feesPerByte[1].plus(1).gt(feesPerByte[0])) {
      feesPerByte[0] = feesPerByte[1].plus(1);
    }
  }
  const feeItems = {
    items: feesPerByte.map((feePerByte, i) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte:
      feesPerByte[Math.floor(feesPerByte.length / 2)] || new BigNumber(0),
    relayFee,
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}
