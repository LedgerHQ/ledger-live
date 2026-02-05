import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Transaction, TransactionStatus } from "../types";

// This method adds additional fields that need to be reviewed when signing a transaction on the device.
async function getDeviceTransactionConfig({
  transaction,
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<CommonDeviceTransactionField>> {
  const fields: Array<CommonDeviceTransactionField> = [];

  if (!amount.isZero()) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (transaction.memo) {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
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
