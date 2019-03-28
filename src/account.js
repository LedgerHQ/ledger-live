/**
 * @flow
 * @module account
 */
import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountRaw,
  TokenAccount,
  TokenAccountRaw,
  AccountIdParams,
  Operation,
  OperationRaw,
  DailyOperations,
  CryptoCurrency,
  DerivationMode
} from "./types";
import { asDerivationMode, getTagDerivationMode } from "./derivation";
import { getCryptoCurrencyById, getTokenById } from "./currencies";
import { getEnv } from "./env";

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const emptyDailyOperations = { sections: [], completed: true };

/**
 * @memberof account
 */
export function groupAccountsOperationsByDay(
  accounts: Account[],
  count: number
): DailyOperations {
  // Track indexes of account.operations[] for each account
  const indexes: number[] = Array(accounts.length).fill(0);
  // Track indexes of account.pendingOperations[] for each account
  const indexesPending: number[] = Array(accounts.length).fill(0);
  // Returns the most recent operation from the account with current indexes
  function getNextOperation(): ?Operation {
    let bestOp: ?Operation;
    let bestOpInfo = { accountI: 0, fromPending: false };
    for (let i = 0; i < accounts.length; i++) {
      // look in operations
      const op = accounts[i].operations[indexes[i]];
      if (op && (!bestOp || op.date > bestOp.date)) {
        bestOp = op;
        bestOpInfo = { accountI: i, fromPending: false };
      }
      // look in pending operations
      const opP = accounts[i].pendingOperations[indexesPending[i]];
      if (opP && (!bestOp || opP.date > bestOp.date)) {
        bestOp = opP;
        bestOpInfo = { accountI: i, fromPending: true };
      }
    }
    if (bestOp) {
      if (bestOpInfo.fromPending) {
        indexesPending[bestOpInfo.accountI]++;
      } else {
        indexes[bestOpInfo.accountI]++;
      }
    }
    return bestOp;
  }

  let op = getNextOperation();
  if (!op) return emptyDailyOperations;
  const sections = [];
  let day = startOfDay(op.date);
  let data = [];
  for (let i = 0; i < count && op; i++) {
    if (op.date < day) {
      sections.push({ day, data });
      day = startOfDay(op.date);
      data = [op];
    } else {
      data.push(op);
    }
    op = getNextOperation();
  }
  sections.push({ day, data });
  return {
    sections,
    completed: !op
  };
}

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof account
 */
export function groupAccountOperationsByDay(
  account: Account,
  count: number
): DailyOperations {
  return groupAccountsOperationsByDay([account], count);
}

export function encodeAccountId({
  type,
  version,
  currencyId,
  xpubOrAddress,
  derivationMode
}: AccountIdParams) {
  return `${type}:${version}:${currencyId}:${xpubOrAddress}:${derivationMode}`;
}

export function decodeAccountId(accountId: string): AccountIdParams {
  invariant(typeof accountId === "string", "accountId is not a string");
  const splitted = accountId.split(":");
  invariant(splitted.length === 5, "invalid size for accountId");
  const [type, version, currencyId, xpubOrAddress, derivationMode] = splitted;
  return {
    type,
    version,
    currencyId,
    xpubOrAddress,
    derivationMode: asDerivationMode(derivationMode)
  };
}

// you can pass account because type is shape of Account
// wallet name is a lib-core concept that usually identify a pool of accounts with the same (seed, cointype, derivation scheme) config.
export function getWalletName({
  seedIdentifier,
  derivationMode,
  currency
}: {
  seedIdentifier: string,
  derivationMode: DerivationMode,
  currency: CryptoCurrency
}) {
  return `${seedIdentifier}_${currency.id}_${derivationMode}`;
}

const MAX_ACCOUNT_NAME_SIZE = 50;

export const getAccountPlaceholderName = ({
  currency,
  index,
  derivationMode
}: {
  currency: CryptoCurrency,
  index: number,
  derivationMode: DerivationMode
}) => {
  const tag = getTagDerivationMode(currency, derivationMode);
  return `${currency.name} ${index + 1}${tag ? ` (${tag})` : ""}`;
};

// An account is empty if there is no operations AND balance is zero.
// balance can be non-zero in edgecases, for instance:
// - Ethereum contract only funds (api limitations)
// - Ripple node that don't show all ledgers and if you have very old txs

export const isAccountEmpty = (a: Account): boolean =>
  a.operations.length === 0 && a.balance.isZero();

export const getNewAccountPlaceholderName = getAccountPlaceholderName; // same naming

export const validateNameEdition = (account: Account, name: ?string): string =>
  (
    (name || account.name || "").replace(/\s+/g, " ").trim() ||
    account.name ||
    getAccountPlaceholderName(account)
  ).slice(0, MAX_ACCOUNT_NAME_SIZE);

export type SortAccountsParam = {
  accounts: Account[],
  accountsBtcBalance: BigNumber[],
  orderAccounts: string
};

type SortMethod = "name" | "balance";

const sortMethod: { [_: SortMethod]: (SortAccountsParam) => string[] } = {
  balance: ({ accounts, accountsBtcBalance }) =>
    accounts
      .map((a, i) => [a.id, accountsBtcBalance[i] || BigNumber(-1), a.name])
      .sort((a, b) => {
        const numOrder = a[1].minus(b[1]).toNumber();
        if (numOrder === 0) {
          return a[2].localeCompare(b[2]);
        }

        return numOrder;
      })
      .map(o => o[0]),

  name: ({ accounts }) =>
    accounts
      .slice(0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(a => a.id)
};

export function sortAccounts(param: SortAccountsParam) {
  const [order, sort] = param.orderAccounts.split("|");
  if (order === "name" || order === "balance") {
    const ids = sortMethod[order](param);
    if (sort === "desc") {
      ids.reverse();
    }
    return ids;
  }
  return null;
}

export const shouldShowNewAccount = (
  currency: CryptoCurrency,
  derivationMode: DerivationMode
) =>
  derivationMode === ""
    ? !!getEnv("SHOW_LEGACY_NEW_ACCOUNT") || !currency.supportsSegwit
    : derivationMode === "segwit" || derivationMode === "native_segwit";

export const toOperationRaw = ({
  date,
  value,
  fee,
  ...op
}: Operation): OperationRaw => ({
  ...op,
  date: date.toISOString(),
  value: value.toString(),
  fee: fee.toString()
});

export const fromOperationRaw = (
  { date, value, fee, extra, ...op }: OperationRaw,
  accountId: string
): Operation => ({
  ...op,
  accountId,
  date: new Date(date),
  value: BigNumber(value),
  fee: BigNumber(fee),
  extra: extra || {}
});

export function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
  const { id, tokenId, operations, balance } = raw;
  const token = getTokenById(tokenId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    id,
    token,
    balance: BigNumber(balance),
    operations: operations.map(convertOperation)
  };
}

export function toTokenAccountRaw(raw: TokenAccount): TokenAccountRaw {
  const { id, token, operations, balance } = raw;
  return {
    id,
    tokenId: token.id,
    balance: balance.toString(),
    operations: operations.map(toOperationRaw)
  };
}

export function fromAccountRaw(rawAccount: AccountRaw): Account {
  const {
    currencyId,
    unitMagnitude,
    operations,
    pendingOperations,
    lastSyncDate,
    balance,
    tokenAccounts,
    ...acc
  } = rawAccount;
  const currency = getCryptoCurrencyById(currencyId);
  const unit =
    currency.units.find(u => u.magnitude === unitMagnitude) ||
    currency.units[0];
  const convertOperation = op => fromOperationRaw(op, acc.id);
  return {
    ...acc,
    balance: BigNumber(balance),
    operations: operations.map(convertOperation),
    pendingOperations: pendingOperations.map(convertOperation),
    unit,
    currency,
    lastSyncDate: new Date(lastSyncDate),
    tokenAccounts: tokenAccounts && tokenAccounts.map(fromTokenAccountRaw)
  };
}

export function toAccountRaw({
  currency,
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
  tokenAccounts,
  ...acc
}: Account): AccountRaw {
  return {
    ...acc,
    operations: operations.map(toOperationRaw),
    pendingOperations: pendingOperations.map(toOperationRaw),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toString(),
    tokenAccounts: tokenAccounts && tokenAccounts.map(toTokenAccountRaw)
  };
}
