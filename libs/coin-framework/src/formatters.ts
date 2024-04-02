import type { Account, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";
import { getAccountCurrency } from "./account";
import { formatCurrencyUnit } from "./currencies";

const formatErrorSmall = (e: Error): string => (e.name === "Error" ? e.message : e.name);

export const formatTransactionStatus = (
  t: TransactionCommon,
  { errors, warnings, estimatedFees, amount, totalSpent }: TransactionStatusCommon,
  mainAccount: Account,
): string => {
  let str = "";
  const account =
    (t.subAccountId && (mainAccount.subAccounts || []).find(a => a.id === t.subAccountId)) ||
    mainAccount;

  str +=
    "\n  amount: " +
    formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  estimated fees: " +
    formatCurrencyUnit(getAccountCurrency(mainAccount).units[0], estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  total spent: " +
    formatCurrencyUnit(getAccountCurrency(account).units[0], totalSpent, {
      showCode: true,
      disableRounding: true,
    });

  str +=
    "\n" +
    `errors: ${Object.entries(errors)
      .map(([key, error]) => `${key} ${formatErrorSmall(error)}`)
      .join(", ")}`;

  str +=
    "\n" +
    `warnings: ${Object.entries(warnings)
      .map(([key, warning]) => `${key} ${formatErrorSmall(warning)}`)
      .join(", ")}`;

  return str;
};
