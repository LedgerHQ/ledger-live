import { decodeTokenAccountId, getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isAmountSpentFromBalance } from "./logic";
import type { TransactionStatus, Transaction } from "./types";

async function getDeviceTransactionConfig({
  account,
  transaction,
  status: { estimatedFees },
}: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}): Promise<Array<DeviceTransactionField>> {
  const fields: Array<DeviceTransactionField> = [];

  const { subAccountId } = transaction;
  const isEsdtTransfer = subAccountId !== undefined && subAccountId !== null;

  if (isEsdtTransfer) {
    const { token } = await decodeTokenAccountId(subAccountId);

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
