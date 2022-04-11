import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { NetworkInfo, CoreTezosLikeAccount } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
type Input = {
  coreAccount: CoreAccount;
  account: Account;
};
type Output = NetworkInfo;

async function tezos({ coreAccount }: Input): Promise<Output> {
  const tezosLikeAccount: CoreTezosLikeAccount =
    await coreAccount.asTezosLikeAccount();
  const bigInt = await tezosLikeAccount.getFees();
  const networkFees = await libcoreBigIntToBigNumber(bigInt);
  // workaround of a bug on server side. set some boundaries.
  const fees = BigNumber.min(BigNumber.max(2500, networkFees), 30000);
  return {
    family: "tezos",
    fees,
  };
}

export default tezos;
