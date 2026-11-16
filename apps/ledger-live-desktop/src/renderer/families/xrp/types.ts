import type {
  Transaction,
  TransactionStatus,
  XrpOperation,
} from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import type { LLDCoinFamily } from "../types";

export type XrpFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, XrpOperation>;
