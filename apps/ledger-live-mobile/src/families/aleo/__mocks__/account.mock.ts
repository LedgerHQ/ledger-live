import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { aleoCurrency } from "./currency.mock";

export const ALEO_ACCOUNT_1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };
