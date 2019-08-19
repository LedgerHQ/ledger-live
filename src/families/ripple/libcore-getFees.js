// @flow
import type { BigNumber } from "bignumber.js";
import type { Account, Unit } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { libcoreAmountToBigNumber } from "../../libcore/buildBigNumber";

type Input = {
  coreAccount: CoreAccount,
  account: Account
};

type Output = Promise<{
  type: "fee",
  value: BigNumber,
  unit: Unit
}>;

async function ripple({ coreAccount, account }: Input): Output {
  const rippleLikeAccount = await coreAccount.asRippleLikeAccount();
  const fees = await rippleLikeAccount.getFees();
  const value = await libcoreAmountToBigNumber(fees);
  return {
    type: "fee",
    value,
    unit: account.currency.units[0]
  };
}

export default ripple;
