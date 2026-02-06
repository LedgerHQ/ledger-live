import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../types";
import { TRANSACTION_TYPE } from "../constants";

const mapTransactionTypeToMethod: Record<TRANSACTION_TYPE, string> = {
  [TRANSACTION_TYPE.TRANSFER_PUBLIC]: "Transfer Public",
  [TRANSACTION_TYPE.TRANSFER_PRIVATE]: "Transfer Private",
  [TRANSACTION_TYPE.SPLIT]: "Split",
  [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: "Convert Public to Private",
  [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: "Convert Private to Public",
};

async function getDeviceTransactionConfig({
  transaction,
  status: { estimatedFees },
}: {
  account: AccountLike;
  parentAccount?: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  const method = mapTransactionTypeToMethod[transaction.type] ?? "Unknown";

  fields.push({
    type: "text",
    label: "Method",
    value: method,
  });

  fields.push({
    type: "amount",
    label: "Amount",
  });

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fees",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
