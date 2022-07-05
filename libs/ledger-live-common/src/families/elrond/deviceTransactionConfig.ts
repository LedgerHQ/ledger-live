import type { TransactionStatus } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";

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
