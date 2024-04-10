import type { Account, TransactionCommon, TransactionStatusCommon } from "@ledgerhq/types-live";
import { getAccountUnit } from "./account";
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
    formatCurrencyUnit(getAccountUnit(account), amount, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  estimated fees: " +
    formatCurrencyUnit(getAccountUnit(mainAccount), estimatedFees, {
      showCode: true,
      disableRounding: true,
    });
  str +=
    "\n  total spent: " +
    formatCurrencyUnit(getAccountUnit(account), totalSpent, {
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
    `errors: ${Object.entries(warnings)
      .map(([key, warning]) => `${key} ${formatErrorSmall(warning)}`)
      .join(", ")}`;

  return str;
};
