// @flow

import type { Account, Transaction, TransactionStatus } from "@ledgerhq/types-live";

export type SendAmountProps = {
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChange: Transaction => void,
  trackProperties?: object,
};
