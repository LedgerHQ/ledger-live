// @flow

import type { Account, Transaction, TransactionStatus } from "@ledgerhq/live-common/lib/types";

export type SendAmountProps = {
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChange: Transaction => void,
};
