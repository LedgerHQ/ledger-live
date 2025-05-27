import type { CommonDeviceTransactionField as DeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";

function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}): Array<DeviceTransactionField> {
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
      const { accountId } = decodeTokenAccountId(account.token.id);
      const transactionAmount = transaction.useAllAmount ? account.balance : transaction.amount;

      fields.push({
        type: "text",
        label: "APT",
        value: formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], transaction.amount, {
          showCode: true,
          disableRounding: true,
        }),
      });
      fields.push({
        type: "text",
        label: "Token Name",
        value: accountId,
      });
      fields.push({
        type: "text",
        label: "Amount",
        value: formatCurrencyUnit(getAccountCurrency(account).units[0], transactionAmount, {
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
  } else if (mode === "stake" && account.type === "Account") {
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
