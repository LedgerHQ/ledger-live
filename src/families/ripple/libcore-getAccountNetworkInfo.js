// @flow
import type { NetworkInfo } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
};

type Output = Promise<NetworkInfo>;

async function ripple({ coreAccount }: Input): Output {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();
  const feesRaw = await rippleLikeAccount.getFees();
  const baseReserveRaw = await rippleLikeAccount.getBaseReserve();
  const baseReserve = await libcoreAmountToBigNumber(baseReserveRaw);
  const serverFee = await libcoreAmountToBigNumber(feesRaw);

  return {
    family: "ripple",
    serverFee,
    baseReserve,
  };
}

export default ripple;
