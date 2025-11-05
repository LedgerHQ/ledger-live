import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Transaction, TransactionStatus } from "../types";
import { methodToString } from "../common-logic";
import BigNumber from "bignumber.js";
import { CASPER_NETWORK } from "../consts";

export type ExtraDeviceTransactionField = {
  type: "casper.extendedAmount";
  label: string;
  value: number | BigNumber;
};

type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

async function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Type",
    value: methodToString(0),
  });
  fields.push({
    type: "text",
    label: "Chain ID",
    value: CASPER_NETWORK,
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

  if (transaction.transferId) {
    fields.push({
      type: "text",
      label: "Transfer ID",
      value: transaction.transferId,
    });
  }

  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
