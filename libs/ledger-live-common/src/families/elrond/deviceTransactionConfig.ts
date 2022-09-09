import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus, Transaction } from "./types";
import { findTokenById } from "@ledgerhq/cryptoassets";

function getDeviceTransactionConfig({
  transaction: { recipient, subAccountId },
  status: { estimatedFees },
}: {
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  const isEsdtTransfer = subAccountId !== undefined && subAccountId !== null;

  if (isEsdtTransfer) {
    const tokenIdentifier = subAccountId.split("+")[1];
    const token = findTokenById(`${tokenIdentifier}`);

    if (token) {
      fields.push({
        type: "text",
        label: "Token",
        value: token.name,
      });

      fields.push({
        type: "amount",
        label: "Value",
      });
    }
  }

  fields.push({
    type: "address",
    label: "Receiver",
    address: recipient,
  });

  if (!isEsdtTransfer) {
    fields.push({
      type: "amount",
      label: "Amount",
    });
  }

  if (!estimatedFees.isZero()) {
    fields.push({
      type: "fees",
      label: "Fee",
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
