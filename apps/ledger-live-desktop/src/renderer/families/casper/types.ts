import {
  CasperAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/casper/types";
import { FieldComponentProps, LLDCoinFamily } from "../types";

export type CasperFamily = LLDCoinFamily<CasperAccount, Transaction, TransactionStatus>;
export type CasperFieldComponentProps = FieldComponentProps<
  CasperAccount,
  Transaction,
  TransactionStatus
>;
