import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus, Transaction } from "./types";

function getDeviceTransactionConfig({
  transaction: { mode, recipient },
  status: { amount, estimatedFees },
}: {
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

  const isDelegationOperation = mode !== "send";
  if (isDelegationOperation) {
    fields.push({
      type: "address",
      label: "Validator",
      address: recipient,
    });
  }
  return fields;
}

export default getDeviceTransactionConfig;
