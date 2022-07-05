import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";

function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  if (transaction.useAllAmount) {
    fields.push({
      type: "text",
      label: "Method",
      value: "Send all",
    });
  } else {
    fields.push({
      type: "text",
      label: "Method",
      value: "Send",
    });
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

  if (transaction.memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
