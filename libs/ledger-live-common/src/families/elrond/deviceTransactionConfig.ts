import type { DeviceTransactionField } from "../../transaction";
import type { TransactionStatus, Transaction } from "./types";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import { decodeTokenAccountId, getAccountUnit } from "../../account";
import { Account } from "@ledgerhq/types-live";
import { isAmountSpentFromBalance } from "./logic";

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

  const { subAccountId } = transaction;
  const isEsdtTransfer = subAccountId !== undefined && subAccountId !== null;

  if (isEsdtTransfer) {
    const { token } = decodeTokenAccountId(subAccountId);

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
    if (!isAmountSpentFromBalance(transaction.mode)) {
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
