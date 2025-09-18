import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";

// This method adds additional fields that need to be reviewed when signing a transaction on the device.
function getDeviceTransactionConfig({
  transaction: {},
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<CommonDeviceTransactionField> {
  const fields: Array<CommonDeviceTransactionField> = [];

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

  return fields;
}

export default getDeviceTransactionConfig;
