import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import BigNumber from "bignumber.js";

export const methodToString = (method: number): string => {
  switch (method) {
    case 0:
      return "Coin transfer";
    default:
      return "Unknown";
  }
};

export type ExtraDeviceTransactionField = {
  type: "aptos.extendedAmount";
  label: string;
  value: number | BigNumber;
};

function getDeviceTransactionConfig(): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Type",
    value: methodToString(0),
  });

  return fields;
}

export default getDeviceTransactionConfig;
