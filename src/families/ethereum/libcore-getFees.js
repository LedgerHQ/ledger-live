// @flow
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

async function ethereum({
  account,
  coreAccount
}: {
  coreAccount: CoreAccount
}) {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const bigInt = await ethereumLikeAccount.getFees();
  const bigNum = await libcoreBigIntToBigNumber(bigInt);

  return {
    type: "gas",
    value: bigNum
  };
}

export default ethereum;
