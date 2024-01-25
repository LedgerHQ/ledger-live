import { BigNumber } from "bignumber.js";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "./currencies";
import { getAccountCurrency, getMainAccount, flattenAccounts } from "./account";
import { flattenOperationWithInternalsAndNfts } from "./operation";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@ledgerhq/types-cryptoassets";

type Field = {
  title: string;
  cell: (
    arg0: AccountLike,
    arg1: Account | null | undefined,
    arg2: Operation,
    arg3: Currency | null | undefined,
    arg4: CounterValuesState | null | undefined,
  ) => string;
};

const newLine = "\r\n";

const fields: Field[] = [
  {
    title: "Operation Date",
    cell: (_account, _parentAccount, op) => op.date.toISOString(),
  },
  {
    title: "Currency Ticker",
    cell: account => getAccountCurrency(account).ticker,
  },
  {
    title: "Operation Type",
    cell: (_account, _parentAccount, op) => op.type,
  },
  {
    title: "Operation Amount",
    cell: (account, parentAccount, op) =>
      formatCurrencyUnit(getAccountCurrency(account).units[0], op.value, {
        disableRounding: true,
        useGrouping: false,
      }),
  },
  {
    title: "Operation Fees",
    cell: (account, parentAccount, op) =>
      ["TokenAccount", "ChildAccount"].includes(account.type)
        ? ""
        : formatCurrencyUnit(getAccountCurrency(account).units[0], op.fee, {
            disableRounding: true,
            useGrouping: false,
          }),
  },
  {
    title: "Operation Hash",
    cell: (_account, _parentAccount, op) => op.hash,
  },
  {
    title: "Account Name",
    cell: (account, parentAccount) => getMainAccount(account, parentAccount).name,
  },
  {
    title: "Account xpub",
    cell: (account, parentAccount) => {
      const main = getMainAccount(account, parentAccount);
      return main.xpub || main.freshAddress;
    },
  },
  {
    title: "Countervalue Ticker",
    cell: (account, parentAccount, op, countervalueCurrency) => {
      return countervalueCurrency?.ticker ?? "";
    },
  },
  {
    title: "Countervalue at Operation Date",
    cell: (account, parentAccount, op, counterValueCurrency, countervalueState) => {
      const value =
        counterValueCurrency && countervalueState
          ? calculate(countervalueState, {
              from: getAccountCurrency(account),
              to: counterValueCurrency,
              value: op.value.toNumber(),
              disableRounding: true,
              date: op.date,
            })
          : null;
      return value && counterValueCurrency
        ? formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(value), {
            disableRounding: true,
            useGrouping: false,
          })
        : "";
    },
  },
  {
    title: "Countervalue at CSV Export",
    cell: (account, parentAccount, op, counterValueCurrency, countervalueState) => {
      const value =
        counterValueCurrency && countervalueState
          ? calculate(countervalueState, {
              from: getAccountCurrency(account),
              to: counterValueCurrency,
              value: op.value.toNumber(),
              disableRounding: true,
            })
          : null;
      return value && counterValueCurrency
        ? formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(value), {
            disableRounding: true,
            useGrouping: false,
          })
        : "";
    },
  },
];

const accountRows = (
  account: AccountLike,
  parentAccount: Account | null | undefined,
  counterValueCurrency?: Currency,
  countervalueState?: CounterValuesState,
): Array<string[]> =>
  account.operations
    .reduce((ops: Operation[], op) => ops.concat(flattenOperationWithInternalsAndNfts(op)), [])
    .map(operation =>
      fields.map(field =>
        field.cell(account, parentAccount, operation, counterValueCurrency, countervalueState),
      ),
    );

const accountsRows = (
  accounts: Account[],
  counterValueCurrency?: Currency,
  countervalueState?: CounterValuesState,
): Array<string[]> =>
  flattenAccounts(accounts).reduce((all: Array<string[]>, account) => {
    const parentAccount =
      account.type !== "Account" ? accounts.find(a => a.id === account.parentId) : null;
    return all.concat(accountRows(account, parentAccount, counterValueCurrency, countervalueState));
  }, []);

export const accountsOpToCSV = (
  accounts: Account[],
  counterValueCurrency?: Currency,
  countervalueState?: CounterValuesState, // cvs state required for countervalues export
): string =>
  fields.map(field => field.title).join(",") +
  newLine +
  accountsRows(accounts, counterValueCurrency, countervalueState)
    .map(row => row.map(value => value.replace(/[,\n\r]/g, "")).join(","))
    .join(newLine);
