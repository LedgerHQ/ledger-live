// @flow
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

async function bitcoin({ coreAccount }: { coreAccount: CoreAccount }) {
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const bigInts = await bitcoinLikeAccount.getFees();
  const bigNumbers = await Promise.all(bigInts.map(libcoreBigIntToBigNumber));

  return {
    type: "feePerBytes",
    value: bigNumbers
  };
}

export default bitcoin;
