import type { Transaction, TransactionStatus } from "./types";
import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike } from "@ledgerhq/types-live";

function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<{ label: string; type: string }> = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (estimatedFees && !estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields as Array<DeviceTransactionField>;
}

export default getDeviceTransactionConfig;
