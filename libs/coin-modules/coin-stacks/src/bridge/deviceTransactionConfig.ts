import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionStatus } from "../types";

export type ExtraDeviceTransactionField =
  | {
      type: "stacks.memo";
      label: string;
      value: string;
    }
  | {
      type: "stacks.extendedAmount";
      label: string;
      value: BigNumber;
    };

export type DeviceTransactionField = CommonDeviceTransactionField | ExtraDeviceTransactionField;

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "stacks.extendedAmount",
    label: "Amount",
    value: input.transaction.amount,
  });
  fields.push({
    type: "stacks.extendedAmount",
    label: "Fees",
    value: input.transaction.fee ? input.transaction.fee : new BigNumber(0),
  });
  fields.push({
    type: "address",
    label: "Recipient",
    address: input.transaction.recipient,
  });
  fields.push({
    type: "text",
    label: "Nonce",
    value: input.transaction.nonce ? input.transaction.nonce.toFixed() : "0",
  });
  fields.push({
    type: "stacks.memo",
    label: "Memo",
    value: input.transaction.memo || "",
  });

  return fields;
}

export default getDeviceTransactionConfig;
