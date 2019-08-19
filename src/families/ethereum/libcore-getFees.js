// @flow
import type { BigNumber } from "bignumber.js";
import type { Account, Unit } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account
};

type Output = Promise<{
  type: "gasPrice",
  value: BigNumber,
  unit: Unit
}>;

async function ethereum({ coreAccount, account }: Input): Output {
  const ethereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const bigInt = await ethereumLikeAccount.getGasPrice();
  const bigNum = await libcoreBigIntToBigNumber(bigInt);
  return {
    type: "gasPrice",
    value: bigNum,
    unit: account.currency.units[1]
  };
}

export default ethereum;
