// @flow
import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { NetworkInfo } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account
};

type Output = Promise<NetworkInfo>;

async function ripple({ coreAccount, account }: Input): Output {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();
  const feesRaw = await rippleLikeAccount.getFees();
  const baseReserveRaw = await rippleLikeAccount.getBaseReserve();
  let baseReserve = await libcoreAmountToBigNumber(baseReserveRaw);
  // Bug in libcore, that value is incorrectly in XRP unit value..
  baseReserve = baseReserve.times(
    BigNumber(10).pow(account.currency.units[0].magnitude)
  );
  const serverFee = await libcoreAmountToBigNumber(feesRaw);

  return {
    family: "ripple",
    serverFee,
    baseReserve
  };
}

export default ripple;
