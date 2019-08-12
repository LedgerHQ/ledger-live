// @flow
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

async function ripple({ coreAccount }: { coreAccount: CoreAccount }) {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();
  const bigInt = await rippleLikeAccount.getFees();
  const bigNum = await libcoreBigIntToBigNumber(bigInt);

  return {
    type: "fee",
    value: bigNum
  };
}

export default ripple;
