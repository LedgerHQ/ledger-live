import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/aleo/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "../types";

export type AleoFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, Operation>;
