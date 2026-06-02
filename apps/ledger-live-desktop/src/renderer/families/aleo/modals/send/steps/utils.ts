import type {
  AleoAccount,
  Transaction as AleoTransaction,
  AleoTokenAccount,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AccountLike } from "@ledgerhq/types-live";

export const isAleoAccount = (acc: AccountLike): acc is AleoAccount | AleoTokenAccount => {
  const currency = acc.type === "Account" ? acc.currency : acc.token.parentCurrency;
  return currency.family === "aleo";
};

export const isAleoTransaction = (tx: Transaction): tx is AleoTransaction => tx.family === "aleo";
