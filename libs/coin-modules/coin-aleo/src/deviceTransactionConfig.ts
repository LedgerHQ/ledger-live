import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import { TRANSACTION_TYPE } from "./constants";
import type { Transaction, TransactionType, TransactionStatus } from "./types";

const mapTransactionModeToMethod: Record<TransactionType, string> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: "Transfer Public",
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: "Transfer Private",
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: "Shield",
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: "Unshield",
};

async function getDeviceTransactionConfig({
  transaction,
  status,
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const method = mapTransactionModeToMethod[transaction.mode] ?? "Unknown";

  fields.push({
    type: "text",
    label: "Method",
    value: method,
  });

  fields.push({
    type: "amount",
    label: "Amount",
  });

  if (!status.estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
