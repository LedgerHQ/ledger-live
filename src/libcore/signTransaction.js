// @flow

import Transport from "@ledgerhq/hw-transport";
import type { CryptoCurrency, Account, TokenAccount } from "../types";
import type { CoreCurrency } from "./types";
import byFamily from "../generated/libcore-hw-signTransaction";

export default (opts: {
  isCancelled: () => boolean,
  transport: Transport<*>,
  account: Account,
  tokenAccount: ?TokenAccount,
  currency: CryptoCurrency,
  coreCurrency: CoreCurrency,
  coreTransaction: *
}) => byFamily[opts.account.currency.family](opts);
