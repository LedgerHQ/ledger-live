// @flow

import type { Account, Operation } from "./types";
import { formatCurrencyUnit } from "./currencies";

type Field = {
  title: string,
  cell: (Account, Operation) => string
};

const fields: Field[] = [
  {
    title: "Operation Date",
    cell: (_, op) => op.date.toISOString()
  },
  {
    title: "Currency Ticker",
    cell: account => account.currency.ticker
  },
  {
    title: "Operation Type",
    cell: (_, op) => op.type
  },
  {
    title: "Operation Amount",
    cell: (account, op) =>
      formatCurrencyUnit(account.currency.units[0], op.value, {
        disableRounding: true,
        useGrouping: false
      })
  },
  {
    title: "Operation Hash",
    cell: (_, op) => op.hash
  },
  {
    title: "Account Name",
    cell: account => account.name
  }
];

const accountRows = (account: Account): Array<string[]> =>
  account.operations.map(operation =>
    fields.map(field => field.cell(account, operation))
  );

const accountsRows = (accounts: Account[]) =>
  accounts.reduce((acc, account) => acc.concat(accountRows(account)), []);

export const accountsOpToCSV = (accounts: Account[]) =>
  fields.map(field => field.title).join(",") +
  "\n" +
  accountsRows(accounts)
    .map(row => row.map(value => value.replace(/,/g, "")).join(","))
    .join("\n");
