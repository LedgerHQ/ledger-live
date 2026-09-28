import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import {
  ConcordiumOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/concordium/types";

// `ConcordiumOperation` rather than `Operation` so the family's own renderers see
// a typed `extra`; the base type leaves it `unknown`, which narrows to `{}` at a
// property read.
export type ConcordiumFamily = LLDCoinFamily<
  Account,
  Transaction,
  TransactionStatus,
  ConcordiumOperation
>;
