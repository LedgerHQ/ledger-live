import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getFamilySpecificData, type Transaction, type TransactionStatus } from "./types";

async function getDeviceTransactionConfig({
  transaction,
  status: { amount, estimatedFees },
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<{ label: string; type: string }> = [];

  if (!amount.isZero()) {
    fields.push({ type: "amount", label: "Amount" });
  }
  if (!estimatedFees.isZero()) {
    fields.push({ type: "fees", label: "Fees" });
  }
  if (getFamilySpecificData(transaction).opReturnData) {
    fields.push({ type: "opReturnData", label: "OP_RETURN" });
  }

  return fields as Array<DeviceTransactionField>;
}

export default getDeviceTransactionConfig;
