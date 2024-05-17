import { isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";

function getDeviceTransactionConfig(input: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];
  const tokenTransfer = Boolean(input.account && isTokenAccount(input.account));

  fields.push({
    type: "address",
    label: "To",
    address: input.transaction.recipient,
  });

  if (tokenTransfer) {
    fields.push({
      type: "text",
      label: "Jetton units",
      value: input.transaction.amount.toString(),
    });
  } else {
    if (input.transaction.useAllAmount) {
      fields.push({
        type: "text",
        label: "Amount",
        value: "ALL YOUR TONs",
      });
    } else {
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }
  }
  if (!input.transaction.comment.isEncrypted && input.transaction.comment.text) {
    fields.push({
      type: "text",
      label: "Comment",
      value: input.transaction.comment.text,
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
