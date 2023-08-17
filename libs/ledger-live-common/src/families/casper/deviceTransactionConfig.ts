import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";
import { Transaction, TransactionStatus } from "./types";
import { methodToString } from "./msc-utils";
import { casperPubKeyToAccountHash } from "./bridge/bridgeHelpers/addresses";

export type ExtraDeviceTransactionField = {
  type: "casper.extendedAmount";
  label: string;
  value: string;
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
    label: "Fees",
    value: transaction.fees.toFixed(),
  });
  fields.push({
    type: "text",
    label: "Target (Account hash)",
    value: casperPubKeyToAccountHash(transaction.recipient),
  });
  fields.push({
    type: "casper.extendedAmount",
    label: "Amount",
    value: transaction.amount.toFixed(),
  });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
