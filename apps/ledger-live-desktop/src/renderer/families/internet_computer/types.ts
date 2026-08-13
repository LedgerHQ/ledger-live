import {
  ICPAccount,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type InternetComputerFamily = LLDCoinFamily<
  ICPAccount,
  Transaction,
  TransactionStatus,
  InternetComputerOperation
>;

export type InternetComputerMemoFieldProps = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
};
