import { BigNumber } from "bignumber.js";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "./currencies";
import { getAccountCurrency, getMainAccount, flattenAccounts } from "./account";
import { flattenOperationWithInternalsAndNfts } from "./operation";
import { calculate } from "@ledgerhq/live-countervalues/logic";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { WalletState, accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";

type Field = {
  title: string;
  cell: (
    arg0: AccountLike,
    arg1: Account | null | undefined,
    arg2: Operation,
    arg3: Currency | null | undefined,
    arg4: CounterValuesState | null | undefined,
    arg5: WalletState | null | undefined,
  ) => string;
};

const newLine = "\r\n";

const fields: Field[] = [
  {
    title: "Operation Date",
    cell: (_account, _parentAccount, op) => op.date.toISOString(),
  },
  {
    title: "Status",
    cell: (_account, _parentAccount, op) => {
      return op.hasFailed ? "Failed" : "Confirmed";
    },
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
      "TokenAccount" === account.type
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
    cell: (account, parentAccount, _op, _counterValueCurrency, _countervalueState, walletState) =>
      walletState
        ? accountNameWithDefaultSelector(walletState, account)
        : getDefaultAccountName(getMainAccount(account, parentAccount)),
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
  walletState?: WalletState,
): Array<string[]> =>
  account.operations
    .reduce((ops: Operation[], op) => ops.concat(flattenOperationWithInternalsAndNfts(op)), [])
    .map(operation =>
      fields.map(field =>
        field.cell(
          account,
          parentAccount,
          operation,
          counterValueCurrency,
          countervalueState,
          walletState,
        ),
      ),
    );

const accountsRows = (
  accounts: Account[],
  counterValueCurrency?: Currency,
  countervalueState?: CounterValuesState,
  walletState?: WalletState,
): Array<string[]> => {
  return flattenAccounts(accounts).reduce((all: Array<string[]>, account) => {
    const parentAccount =
      account.type !== "Account" ? accounts.find(a => a.id === account.parentId) : null;
    return all.concat(
      accountRows(account, parentAccount, counterValueCurrency, countervalueState, walletState),
    );
  }, []);
};

export const accountsOpToCSV = (
  accounts: Account[],
  counterValueCurrency?: Currency,
  countervalueState?: CounterValuesState, // cvs state required for countervalues export
  walletState?: WalletState, // wallet state required for account name
): string =>
  fields.map(field => field.title).join(",") +
  newLine +
  accountsRows(accounts, counterValueCurrency, countervalueState, walletState)
    .map(row => row.map(value => value.replace(/[,\n\r]/g, "")).join(","))
    .join(newLine);
