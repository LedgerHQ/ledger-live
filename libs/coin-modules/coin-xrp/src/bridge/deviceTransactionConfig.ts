import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";

async function getDeviceTransactionConfig({
  transaction: { tag },
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
