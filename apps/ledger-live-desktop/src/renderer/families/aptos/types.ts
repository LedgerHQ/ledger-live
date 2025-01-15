import {
  AptosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/aptos/types";
import { Operation } from "@ledgerhq/types-live";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type AptosFamily = LLDCoinFamily<AptosAccount, Transaction, TransactionStatus, Operation>;
export type AptosFieldComponentProps = FieldComponentProps<
  AptosAccount,
  Transaction,
  TransactionStatus
>;
