import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus, Transaction } from "./types";
import { findTokenById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import { getAccountUnit } from "../../account";
import { Account } from "@ledgerhq/types-live";

function getDeviceTransactionConfig({
  account,
  transaction,
  status: { estimatedFees },
}: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const fields: Array<DeviceTransactionField> = [];

  const isEsdtTransfer =
    transaction.subAccountId !== undefined && transaction.subAccountId !== null;

  if (isEsdtTransfer) {
    const tokenIdentifier = transaction.subAccountId?.split("+")[1];
    const token = findTokenById(`${tokenIdentifier?.replaceAll("%2F", "/")}`);

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
    address: transaction.recipient,
  });

  if (!isEsdtTransfer) {
    if (transaction.mode === "unDelegate") {
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountUnit(account), new BigNumber(0), {
          showCode: true,
          disableRounding: true,
        }),
      });
    } else {
      fields.push({
        type: "amount",
        label: "Amount",
      });
    }
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
