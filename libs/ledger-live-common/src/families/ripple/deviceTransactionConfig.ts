import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";

function getDeviceTransactionConfig({
  transaction: { tag },
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

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
