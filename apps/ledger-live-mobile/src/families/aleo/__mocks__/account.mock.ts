import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { AleoAccount, AleoTokenAccount } from "@ledgerhq/live-common/families/aleo/types";
import { aleoCurrency, aleoTokenCurrency } from "./currency.mock";

const baseAccount1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };

export const ALEO_TOKEN_ACCOUNT_1: AleoTokenAccount = {
  ...(genTokenAccount(0, baseAccount1, aleoTokenCurrency) as AleoTokenAccount),
  transparentBalance: new BigNumber(500_000),
  privateBalance: new BigNumber(300_000),
  unspentPrivateRecords: null,
};

export const ALEO_ACCOUNT_1: AleoAccount = { ...baseAccount1, subAccounts: [ALEO_TOKEN_ACCOUNT_1] };
export const ALEO_ACCOUNT_2: AleoAccount = {
  ...genAccount("aleo-2", { currency: aleoCurrency }),
  index: 1,
};
