import type { AccountLike, Account } from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { isTokenAssociateTransaction } from "./logic/utils";
import type { Transaction, TransactionStatus } from "./types";

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

  const method = (() => {
    if (isTokenAssociateTransaction(transaction)) return "Associate Token";
    else if (transaction.useAllAmount) return "Transfer All";
    else return "Transfer";
  })();

  fields.push({
    type: "text",
    label: "Method",
    value: method,
  });

  if (!isTokenAssociateTransaction(transaction)) {
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
