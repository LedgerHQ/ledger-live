import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CASPER_NETWORK } from "./constants";
import { methodToString } from "./logic";
import { getEstimatedFees } from "./logic/estimateFees";
import { Transaction, TransactionStatus } from "./types";

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
  const fields: Array<DeviceTransactionField> = [
    { type: "text", label: "Type", value: methodToString(0) },
    { type: "text", label: "Chain ID", value: CASPER_NETWORK },
    { type: "casper.extendedAmount", label: "Fee", value: transaction.fees ?? getEstimatedFees() },
    { type: "casper.extendedAmount", label: "Amount", value: transaction.amount },
  ];

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
