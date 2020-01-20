// @flow

import type { Account, AccountLike, Operation } from "./types";
import { formatCurrencyUnit } from "./currencies";
import { getAccountCurrency, getMainAccount, flattenAccounts } from "./account";
import { flattenOperationWithInternals } from "./operation";

type Field = {
  title: string,
  cell: (AccountLike, ?Account, Operation) => string
};

const newLine = "\r\n";

const fields: Field[] = [
  {
    title: "Operation Date",
    cell: (_account, _parentAccount, op) => op.date.toISOString()
  },
  {
    title: "Currency Ticker",
    cell: account => getAccountCurrency(account).ticker
  },
  {
    title: "Operation Type",
    cell: (_account, _parentAccount, op) => op.type
  },
  {
    title: "Operation Amount",
    cell: (account, parentAccount, op) =>
      formatCurrencyUnit(getAccountCurrency(account).units[0], op.value, {
        disableRounding: true,
        useGrouping: false
      })
  },
  {
    title: "Operation Fees",
    cell: (account, parentAccount, op) =>
      ["TokenAccount", "ChildAccount"].includes(account.type)
        ? ""
        : formatCurrencyUnit(getAccountCurrency(account).units[0], op.fee, {
            disableRounding: true,
            useGrouping: false
          })
  },
  {
    title: "Operation Hash",
    cell: (_account, _parentAccount, op) => op.hash
  },
  {
    title: "Account Name",
    cell: (account, parentAccount) =>
      getMainAccount(account, parentAccount).name
  },
  {
    title: "Account xpub",
    cell: (account, parentAccount) => {
      const main = getMainAccount(account, parentAccount);
      return main.xpub || main.freshAddress;
    }
  }
];

const accountRows = (
  account: AccountLike,
  parentAccount: ?Account
): Array<string[]> =>
  account.operations
    .reduce((ops, op) => ops.concat(flattenOperationWithInternals(op)), [])
    .map(operation =>
      fields.map(field => field.cell(account, parentAccount, operation))
    );

const accountsRows = (accounts: Account[]) =>
  flattenAccounts(accounts).reduce((all, account) => {
    const parentAccount =
      account.type === "TokenAccount"
        ? accounts.find(a => a.id === account.parentId)
        : null;
    return all.concat(accountRows(account, parentAccount));
  }, []);

export const accountsOpToCSV = (accounts: Account[]) =>
  fields.map(field => field.title).join(",") +
  newLine +
  accountsRows(accounts)
    .map(row => row.map(value => value.replace(/[,\n\r]/g, "")).join(","))
    .join(newLine);
