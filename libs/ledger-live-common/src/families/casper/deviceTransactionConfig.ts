import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";
import { Transaction, TransactionStatus } from "./types";
import { casperPubKeyToAccountHash, methodToString } from "./utils";

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
    type: "casper.extendedAmount",
    label: "Amount",
    value: transaction.amount.toFixed(),
  });
  fields.push({
    type: "casper.extendedAmount",
    label: "Fees",
    value: transaction.fees.toFixed(),
  });
  fields.push({
    type: "text",
    label: "Recipient (Account hash)",
    value: casperPubKeyToAccountHash(transaction.recipient),
  });
  fields.push({
    type: "text",
    label: "Recipient (Public Key)",
    value: transaction.recipient,
  });
  fields.push({
    type: "text",
    label: "Transfer ID",
    value: transaction.transferId ?? "-",
  });
  fields.push({
    type: "text",
    label: "Method",
    value: methodToString(0),
  });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
