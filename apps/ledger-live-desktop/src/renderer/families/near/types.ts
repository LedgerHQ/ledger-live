import {
  NearAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/near/types";
import { LLDCoinFamily } from "../types";
import { Operation } from "@ledgerhq/types-live";

export type NearFamily = LLDCoinFamily<NearAccount, Transaction, TransactionStatus, Operation>;
