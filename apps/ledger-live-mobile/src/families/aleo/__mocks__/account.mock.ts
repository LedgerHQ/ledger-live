import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { aleoCurrency, aleoTokenCurrency } from "./currency.mock";

export const ALEO_ACCOUNT_1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };
export const ALEO_ACCOUNT_2 = { ...genAccount("aleo-2", { currency: aleoCurrency }), index: 1 };

export const ALEO_TOKEN_ACCOUNT_1 = genTokenAccount(0, ALEO_ACCOUNT_1, aleoTokenCurrency);
