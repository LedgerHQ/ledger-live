import {
  KaspaAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kaspa/types";
import { LLDCoinFamily } from "../types";
import { Operation } from "@ledgerhq/types-live";

export type KaspaFamily = LLDCoinFamily<KaspaAccount, Transaction, TransactionStatus, Operation>;
