import type { Account, AccountLike } from "@ledgerhq/types-live";
import { DeviceTransactionField } from "../../transaction";
import type { Transaction, TransactionStatus } from "./types";

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "address",
    label: "To",
    address: input.transaction.recipient,
  });
  if (input.transaction.useAllAmount) {
    fields.push({
      type: "text",
      label: "Amount",
      value: "ALL YOUR TONs",
    });
  } else {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }
  if (!input.transaction.comment.isEncrypted && input.transaction.comment.text) {
    fields.push({
      type: "text",
      label: "Comment",
      value: input.transaction.comment.text,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
