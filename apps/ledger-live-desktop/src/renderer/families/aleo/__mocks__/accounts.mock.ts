import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { aleoCurrency } from "./currency.mock";

export const ALEO_ACCOUNT_1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };
export const ALEO_ACCOUNT_2 = { ...genAccount("aleo-2", { currency: aleoCurrency }), index: 1 };
export const ALEO_ACCOUNT_3 = { ...genAccount("aleo-3", { currency: aleoCurrency }), index: 2 };
export const NEW_ALEO_ACCOUNT: Account = {
  ...genAccount("aleo-4", { currency: aleoCurrency }),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  subAccounts: [],
  creationDate: new Date(),
  used: false,
  index: 3,
};
