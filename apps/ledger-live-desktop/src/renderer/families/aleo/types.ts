import type {
  AleoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aleo/types";
import type { Operation } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "../types";

export type AleoFamily = LLDCoinFamily<AleoAccount, Transaction, TransactionStatus, Operation>;
