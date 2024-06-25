import { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";

// TODO: delete the parameter if we don't need it
function getDeviceTransactionConfig(_input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Amount",
  });
  fields.push({
    type: "text",
    label: "Gas Limit",
    value: "", // TODO: review it when we have a way to get the gas limit and price
  });
  fields.push({
    type: "text",
    label: "Gas Price",
    value: "", // TODO: review it when we have a way to get the gas limit and price
  });

  return fields;
}

export default getDeviceTransactionConfig;
