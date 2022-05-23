import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike, TransactionStatus } from "../../types";
import type { Transaction } from "./types";

export type ExtraDeviceTransactionField = {
  type: "stacks.memo";
  label: string;
  value: string;
};

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Value",
  });
  fields.push({
    type: "fees",
    label: "Fees",
  });
  fields.push({
    type: "stacks.memo",
    label: "Memo",
    value: input.transaction.memo || "-",
  });

  return fields;
}

export default getDeviceTransactionConfig;
