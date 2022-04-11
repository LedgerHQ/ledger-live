import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
type Input = {
  coreAccount: CoreAccount;
  account: Account;
};
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

async function bitcoin({ coreAccount }: Input): Promise<NetworkInfo> {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const bigInts = await bitcoinLikeAccount.getFees();
  const bigNumbers = await promiseAllBatched(
    10,
    bigInts,
    libcoreBigIntToBigNumber
  );
  const normalized = avoidDups(
    bigNumbers.map((bn) => bn.div(1000).integerValue(BigNumber.ROUND_CEIL))
  );
  const feeItems = {
    items: normalized.map((feePerByte, i) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte:
      normalized[Math.floor(normalized.length / 2)] || new BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}

export default bitcoin;
