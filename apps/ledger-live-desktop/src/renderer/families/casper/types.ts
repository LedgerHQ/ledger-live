import {
  CasperAccount,
  CasperOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/casper/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";
import type { Account } from "@ledgerhq/types-live";

export type CasperFamily = LLDCoinFamily<
  CasperAccount,
  Transaction,
  TransactionStatus,
  CasperOperation
>;
export type CasperFieldComponentProps = FieldComponentProps<
  CasperAccount,
  Transaction,
  TransactionStatus
>;
export type TransferIdProps = {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
};

export type MemoTagFieldProps = TransferIdProps & {
  autoFocus?: boolean;
};
