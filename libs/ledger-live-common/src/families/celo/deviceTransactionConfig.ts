import type { DeviceTransactionField } from "../../transaction";

function getDeviceTransactionConfig(): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Amount",
  });

  fields.push({
    type: "fees",
    label: "Fees",
  });

  return fields;
}

export default getDeviceTransactionConfig;
