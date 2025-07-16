import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import type { TransactionStatus, Transaction } from "./types";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { decodeTokenAccountId, getAccountCurrency } from "@ledgerhq/coin-framework/account";
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
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], new BigNumber(0), {
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
