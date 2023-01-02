import type { DeviceTransactionField } from "../../transaction";
import type { Transaction } from "./types";

function getDeviceTransactionConfig({
  transaction,
}: {
  transaction: Transaction;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  const confirmField = {
    type: "text",
    label: "Confirm",
  } as DeviceTransactionField;
  const amountField = {
    type: "amount",
    label: "Amount",
  } as DeviceTransactionField;
  const validatorField = {
    type: "address",
    label: "To",
    address: transaction.recipient,
  } as DeviceTransactionField;

  switch (transaction.mode) {
    case "stake":
      fields.push({
        ...confirmField,
        value: "deposit_and_stake",
      } as DeviceTransactionField);
      fields.push({
        type: "amount",
        label: "Deposit",
      });
      fields.push(validatorField);
      break;

    case "unstake":
      if (transaction.useAllAmount) {
        fields.push({
          ...confirmField,
          value: "unstake_all",
        } as DeviceTransactionField);
      } else {
        fields.push({
          ...confirmField,
          value: "unstake",
        } as DeviceTransactionField);
      }
      fields.push(validatorField);
      fields.push(amountField);
      break;

    case "withdraw":
      if (transaction.useAllAmount) {
        fields.push({
          ...confirmField,
          value: "withdraw_all",
        } as DeviceTransactionField);
      } else {
        fields.push({
          ...confirmField,
          value: "withdraw",
        } as DeviceTransactionField);
      }
      fields.push(validatorField);
      fields.push(amountField);
      break;

    default:
      fields.push({
        ...confirmField,
        value: "transfer",
      } as DeviceTransactionField);
      fields.push(amountField);
  }

  return fields;
}

export default getDeviceTransactionConfig;
