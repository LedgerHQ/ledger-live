import { Account, Operation } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/concordium/types";

export type ConcordiumFamily = LLDCoinFamily<
  Account,
  Transaction,
  TransactionStatus,
  Operation
> & {};
