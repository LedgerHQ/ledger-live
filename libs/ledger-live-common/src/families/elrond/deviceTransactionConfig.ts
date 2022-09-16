import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus } from "./types";

function getDeviceTransactionConfig({
  status: { amount, estimatedFees },
}: {
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
  return fields;
}

export default getDeviceTransactionConfig;
