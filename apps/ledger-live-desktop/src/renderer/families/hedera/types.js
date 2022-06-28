// @flow

import type {
  Account,
  Transaction,
  TransactionStatus,
  FeeStrategy,
} from "@ledgerhq/live-common/lib/types";

export type SendAmountProps = {
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
  onChange: Transaction => void,
  updateTransaction: (updater: any) => void,
  mapStrategies?: FeeStrategy => FeeStrategy & { [string]: * },
};
