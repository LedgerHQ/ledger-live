// @flow

import type { TokenAccount, Account, CryptoCurrency } from "../../types";
import type { CoreAccount } from "../types";
import byFamily from "../../generated/libcore-buildTokenAccounts";

export async function buildTokenAccounts(arg: {
  currency: CryptoCurrency,
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account
}): Promise<?(TokenAccount[])> {
  const f = byFamily[arg.currency.family];
  if (f) {
    const res = await f(arg);
    return res;
  }
}
