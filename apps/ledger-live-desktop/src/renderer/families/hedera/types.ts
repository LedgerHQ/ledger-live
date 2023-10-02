import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/hedera/types";

import { Account, Operation } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";

export type HederaFamily = LLDCoinFamily<Account, Transaction, TransactionStatus, Operation>;

export type SendAmountProps = {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
};
