// @flow
import type { Account } from "../../types";
import type { NetworkInfo } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account,
};

type Output = Promise<NetworkInfo>;

async function ethereum({ coreAccount }: Input): Output {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const bigInt = await ethereumLikeAccount.getGasPrice();
  const gasPrice = await libcoreBigIntToBigNumber(bigInt);
  return {
    family: "ethereum",
    gasPrice,
  };
}

export default ethereum;
