// @flow

import type { SubAccount, Account, CryptoCurrency } from "../../types";
import type { CoreAccount } from "../types";
import byFamily from "../../generated/libcore-buildSubAccounts";

export async function buildSubAccounts(arg: {
  currency: CryptoCurrency,
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account
}): Promise<?(SubAccount[])> {
  const f = byFamily[arg.currency.family];
  if (f) {
    const res = await f(arg);
    return res;
  }
}
