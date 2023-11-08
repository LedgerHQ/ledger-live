import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";
import { Transaction, TransactionStatus } from "./types";
import { methodToString } from "./msc-utils";
import BigNumber from "bignumber.js";

export type ExtraDeviceTransactionField = {
  type: "casper.extendedAmount";
  label: string;
  value: number | BigNumber;
};

function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Type",
    value: methodToString(0),
  });
  fields.push({
    type: "casper.extendedAmount",
    label: "Fee",
    value: transaction.fees,
  });
  fields.push({
    type: "casper.extendedAmount",
    label: "Amount",
    value: transaction.amount,
  });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
