import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { DeviceTransactionField } from "../../transaction";
import { Transaction, TransactionStatus } from "./types";
import { casperPubKeyToAccountHash, methodToString } from "./utils";

export type ExtraDeviceTransactionField =
  | {
      type: "casper.method";
      label: string;
      value: string;
    }
  | {
      type: "casper.fees";
      label: string;
      value: string;
    }
  | {
      type: "casper.amount";
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
    type: "casper.amount",
    label: "Amount",
    value: `${transaction.amount.toNumber().toLocaleString()} motes`,
  });
  fields.push({
    type: "casper.fees",
    label: "Fees",
    value: `${transaction.fees.toLocaleString()} motes`,
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
    type: "casper.method",
    label: "Method",
    value: methodToString(0),
  });

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
