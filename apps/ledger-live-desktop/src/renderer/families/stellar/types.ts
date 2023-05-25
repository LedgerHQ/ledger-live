import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";
import { Account } from "@ledgerhq/types-live";
import { FieldComponentProps, LLDCoinFamily } from "../types";
import { ModalsData } from "./modals";

export type StellarFamily = LLDCoinFamily<Account, Transaction, TransactionStatus>;
export type StellarFieldComponentProps = FieldComponentProps<
  Account,
  Transaction,
  TransactionStatus
>;
