// @flow
import { BigNumber } from "bignumber.js";
import type { NetworkInfo } from "./types";
import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account,
};

type Output = Promise<NetworkInfo>;

const speeds = ["high", "standard", "low"];

async function bitcoin({ coreAccount }: Input): Output {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const bigInts = await bitcoinLikeAccount.getFees();
  const bigNumbers = await promiseAllBatched(
    10,
    bigInts,
    libcoreBigIntToBigNumber
  );
  let normalized = bigNumbers.map((bn) =>
    bn.div(1000).integerValue(BigNumber.ROUND_CEIL)
  );

  if (normalized[1].eq(normalized[2]) || normalized[1].eq(normalized[0])) {
    // NB if two of the fees are the same, use the lowest as a base and increase the rest
    normalized = [normalized[2].plus(2), normalized[2].plus(1), normalized[2]];
  }

  const feeItems = {
    items: normalized.map((feePerByte, i) => ({
      key: String(i),
      speed: speeds[i],
      feePerByte,
    })),
    defaultFeePerByte:
      normalized[Math.floor(normalized.length / 2)] || BigNumber(0),
  };
  return {
    family: "bitcoin",
    feeItems,
  };
}

export default bitcoin;
