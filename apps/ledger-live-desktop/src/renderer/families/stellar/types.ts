import {
  StellarOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/stellar/types";
import { Account } from "@ledgerhq/types-live";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type StellarFamily = LLDCoinFamily<
  Account,
  Transaction,
  TransactionStatus,
  StellarOperation
>;
export type StellarFieldComponentProps = FieldComponentProps<
  Account,
  Transaction,
  TransactionStatus
>;
