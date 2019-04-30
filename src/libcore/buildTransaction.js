// @flow
import type { TokenAccount, Account, Transaction } from "../types";
import type { Core, CoreCurrency, CoreAccount } from "./types";
import byFamily from "../generated/libcore-buildTransaction";

export default (opts: {
  account: Account,
  tokenAccount: ?TokenAccount,
  core: Core,
  coreAccount: CoreAccount,
  coreCurrency: CoreCurrency,
  transaction: Transaction,
  isPartial: boolean,
  isCancelled: () => boolean
}) => byFamily[opts.account.currency.family](opts);
