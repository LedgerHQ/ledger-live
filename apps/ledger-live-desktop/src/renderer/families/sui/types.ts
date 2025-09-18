import {
  SuiAccount,
  SuiOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/sui/types";
import { LLDCoinFamily } from "../types";

export type SuiFamily = LLDCoinFamily<SuiAccount, Transaction, TransactionStatus, SuiOperation>;
