import {
  AptosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aptos/types";
import { LLDCoinFamily } from "../types";
import { Operation } from "@ledgerhq/types-live";

export type AptosFamily = LLDCoinFamily<AptosAccount, Transaction, TransactionStatus, Operation>;
