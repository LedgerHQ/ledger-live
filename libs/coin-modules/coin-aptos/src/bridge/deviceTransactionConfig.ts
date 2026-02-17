import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "../types";

async function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}): Promise<Array<DeviceTransactionField>> {
  const { mode } = transaction;
  const fields: DeviceTransactionField[] = [];
  const mainAccount = getMainAccount(account, parentAccount);

  const { fees } = transaction;
  if (fees) {
    fields.push({
      type: "text",
      label: "Transaction Fee",
      value: formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], fees, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  if (mode === "send") {
    if (account.type === "TokenAccount") {
      fields.push({
        type: "text",
        label: "Type",
        value: "Token transfer",
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
    } else if (account.type === "Account") {
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
    }
  } else if ((mode === "stake" || mode === "restake") && account.type === "Account") {
    fields.push({
      type: "text",
      label: "Delegate to",
      value: transaction.recipient,
    });
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
  } else if (mode === "unstake" && account.type === "Account") {
    fields.push({
      type: "text",
      label: "Undelegate from",
      value: transaction.recipient,
    });
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
  } else if (mode === "withdraw" && account.type === "Account") {
    fields.push({
      type: "text",
      label: "Amount",
      value: formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
        showCode: true,
        disableRounding: true,
      }),
    });
  }

  return fields;
}

export default getDeviceTransactionConfig;
