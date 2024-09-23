import { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Transaction } from "./types";

// TODO: delete the parameter if we don't need it
function getDeviceTransactionConfig(input: {
  transaction: Transaction;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Amount",
  });
  fields.push({
    type: "text",
    label: "Gas Limit",
    value: input.transaction.gasLimit.toString(),
  });
  fields.push({
    type: "text",
    label: "Gas Price",
    value: input.transaction.gasPrice.toString(),
  });

  return fields;
}

export default getDeviceTransactionConfig;
