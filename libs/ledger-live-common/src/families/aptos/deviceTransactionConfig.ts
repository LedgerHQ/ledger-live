import { log } from "@ledgerhq/logs";
// import { Account, AccountLike } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";
// import { Transaction, TransactionStatus } from "./types";
// import { methodToString } from "./msc-utils";
import BigNumber from "bignumber.js";

export const methodToString = (method: number): string => {
  switch (method) {
    case 0:
      return "Token transfer";
    default:
      return "Unknown";
  }
};

export type ExtraDeviceTransactionField = {
  type: "aptos.extendedAmount";
  label: string;
  value: number | BigNumber;
};

// function getDeviceTransactionConfig({
//   transaction,
// }: {
function getDeviceTransactionConfig(): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Type",
    value: methodToString(0),
  });
  // fields.push({
  //   type: "aptos.extendedAmount",
  //   label: "Fee",
  //   value: transaction.fees,
  // });
  // fields.push({
  //   type: "aptos.extendedAmount",
  //   label: "Amount",
  //   value: transaction.amount,
  // });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
