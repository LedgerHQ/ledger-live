import {
  SuiAccount,
  SuiOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/sui/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type SuiFamily = LLDCoinFamily<SuiAccount, Transaction, TransactionStatus, SuiOperation>;
export type SuiFieldComponentProps = FieldComponentProps<
  SuiAccount,
  Transaction,
  TransactionStatus
>;
