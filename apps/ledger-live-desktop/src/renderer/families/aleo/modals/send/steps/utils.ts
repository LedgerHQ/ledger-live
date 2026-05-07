import type {
  AleoAccount,
  Transaction as AleoTransaction,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AccountLike } from "@ledgerhq/types-live";

export const isAleoAccount = (acc: AccountLike): acc is AleoAccount => "aleoResources" in acc;
export const isAleoTransaction = (tx: Transaction): tx is AleoTransaction => tx.family === "aleo";
