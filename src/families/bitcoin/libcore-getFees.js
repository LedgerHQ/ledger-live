// @flow
import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account
};

type Output = Promise<{
  type: "feePerBytes",
  value: BigNumber[]
}>;

async function bitcoin({ coreAccount }: Input): Output {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const bigInts = await bitcoinLikeAccount.getFees();
  const bigNumbers = await Promise.all(bigInts.map(libcoreBigIntToBigNumber));
  const normalized = bigNumbers.map(bn =>
    bn.div(1000).integerValue(BigNumber.ROUND_CEIL)
  );
  return {
    type: "feePerBytes",
    value: normalized
  };
}

export default bitcoin;
