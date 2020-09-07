// @flow

import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike, TransactionStatus } from "../../types";
import type { Transaction } from "../bitcoin/types";

function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const fields = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Max fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
