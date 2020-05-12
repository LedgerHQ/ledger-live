// @flow

import type { AccountLike, Account, TransactionStatus } from "../../types";
import type { Transaction } from "./types";
import type { DeviceTransactionField } from "../../transaction";

function getDeviceTransactionConfig({
  transaction,
  status,
}: {
  account: AccountLike,
  parentAccount: ?Account,
  transaction: Transaction,
  status: TransactionStatus,
}): Array<DeviceTransactionField> {
  const { amount, tag } = transaction;
  const { estimatedFees } = status;

  const fields = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  if (tag) {
    fields.push({
      type: "text",
      label: "Tag",
      value: tag ? String(tag) : "",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
