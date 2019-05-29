/**
 * @flow
 * @module account
 */

// TODO split into folder & subfiles

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

export const reorderTokenAccountsByCountervalues = (rates: {
  [ticker: string]: number // rates by ticker (on the same countervalue reference)
}) => (tokenAccounts: TokenAccount[]): TokenAccount[] => {
  const meta = tokenAccounts
    .map((ta, index) => ({
      price: ta.balance.times(rates[ta.token.ticker] || 0).toNumber(),
      ticker: ta.token.ticker,
      index
    }))
    .sort((a, b) => {
      if (a.price === b.price) {
        return a.ticker.localeCompare(b.ticker);
      }
      return b.price - a.price;
    });
  if (meta.every((m, i) => m.index === i)) {
    // account ordering is preserved, we keep the same array reference (this should happen most of the time)
    return tokenAccounts;
  }
  // otherwise, need to reorder
  return meta.map(m => tokenAccounts[m.index]);
};

// high level utility that uses reorderTokenAccountsByCountervalues and keep reference if unchanged
export const reorderAccountByCountervalues = (rates: {
  [ticker: string]: number // rates by ticker (on the same countervalue reference)
}) => (account: Account): Account => {
  if (!account.tokenAccounts) return account;
  const tokenAccounts = reorderTokenAccountsByCountervalues(rates)(
    account.tokenAccounts
  );
  if (tokenAccounts === account.tokenAccounts) return account;
  return { ...account, tokenAccounts };
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

export const inferSubOperations = (
  txHash: string,
  tokenAccounts: TokenAccount[]
): Operation[] => {
  const all = [];
  for (let i = 0; i < tokenAccounts.length; i++) {
    const ta = tokenAccounts[i];
    for (let j = 0; j < ta.operations.length; j++) {
      const op = ta.operations[j];
      if (op.hash === txHash) {
        all.push(op);
      }
    }
  }
  return all;
};

export const toOperationRaw = ({
  date,
  value,
  fee,
  subOperations, // eslint-disable-line
  ...op
}: Operation): OperationRaw => ({
  ...op,
  date: date.toISOString(),
  value: value.toString(),
  fee: fee.toString()
});

export const fromOperationRaw = (
  { date, value, fee, extra, ...op }: OperationRaw,
  accountId: string,
  tokenAccounts?: ?(TokenAccount[])
): Operation => {
  const res: $Exact<Operation> = {
    ...op,
    accountId,
    date: new Date(date),
    value: BigNumber(value),
    fee: BigNumber(fee),
    extra: extra || {}
  };

  if (tokenAccounts) {
    res.subOperations = inferSubOperations(op.hash, tokenAccounts);
  }

  return res;
};

export function fromTokenAccountRaw(raw: TokenAccountRaw): TokenAccount {
  const { id, tokenId, operations, balance } = raw;
  const token = getTokenById(tokenId);
  const convertOperation = op => fromOperationRaw(op, id);
  return {
    type: "TokenAccount",
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
    id,
    seedIdentifier,
    derivationMode,
    index,
    xpub,
    freshAddress,
    freshAddressPath,
    name,
    blockHeight,
    endpointConfig,
    currencyId,
    unitMagnitude,
    operations,
    pendingOperations,
    lastSyncDate,
    balance,
    tokenAccounts: tokenAccountsRaw
  } = rawAccount;

  const tokenAccounts =
    tokenAccountsRaw && tokenAccountsRaw.map(fromTokenAccountRaw);

  const currency = getCryptoCurrencyById(currencyId);

  const unit =
    currency.units.find(u => u.magnitude === unitMagnitude) ||
    currency.units[0];

  const convertOperation = op => fromOperationRaw(op, id, tokenAccounts);

  const res: $Exact<Account> = {
    type: "Account",
    id,
    seedIdentifier,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    name,
    blockHeight,
    balance: BigNumber(balance),
    operations: (operations || []).map(convertOperation),
    pendingOperations: (pendingOperations || []).map(convertOperation),
    unit,
    currency,
    lastSyncDate: new Date(lastSyncDate || 0)
  };

  if (xpub) {
    res.xpub = xpub;
  }

  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }

  if (tokenAccounts) {
    res.tokenAccounts = tokenAccounts;
  }

  return res;
}

export function toAccountRaw({
  id,
  seedIdentifier,
  xpub,
  name,
  derivationMode,
  index,
  freshAddress,
  freshAddressPath,
  blockHeight,
  currency,
  operations,
  pendingOperations,
  unit,
  lastSyncDate,
  balance,
  tokenAccounts,
  endpointConfig
}: Account): AccountRaw {
  const res: $Exact<AccountRaw> = {
    id,
    seedIdentifier,
    name,
    derivationMode,
    index,
    freshAddress,
    freshAddressPath,
    blockHeight,
    operations: operations.map(toOperationRaw),
    pendingOperations: pendingOperations.map(toOperationRaw),
    currencyId: currency.id,
    unitMagnitude: unit.magnitude,
    lastSyncDate: lastSyncDate.toISOString(),
    balance: balance.toString()
  };
  if (endpointConfig) {
    res.endpointConfig = endpointConfig;
  }
  if (xpub) {
    res.xpub = xpub;
  }
  if (tokenAccounts) {
    res.tokenAccounts = tokenAccounts.map(toTokenAccountRaw);
  }
  return res;
}

export function canBeMigrated(account: Account) {
  const { type, currencyId } = decodeAccountId(account.id);
  // at the moment migrations requires experimental libcore
  if (!getEnv("EXPERIMENTAL_LIBCORE")) return false;
  return type === "ethereumjs" && currencyId === "ethereum"; // TODO remove currencyId match
}

// attempt to find an account in scanned accounts that satisfy a migration
export function findAccountMigration(
  account: Account,
  scannedAccounts: Account[]
): ?Account {
  if (!canBeMigrated(account)) return;
  const { type } = decodeAccountId(account.id);
  if (type === "ethereumjs") {
    return scannedAccounts.find(a => a.freshAddress === account.freshAddress);
  }
}

export type AddAccountsSection = {
  id: string,
  selectable: boolean,
  defaultSelected: boolean,
  data: Account[]
};

export type AddAccountsSectionResult = {
  sections: AddAccountsSection[],
  alreadyEmptyAccount: ?Account
};

/**
 * logic that for the Add Accounts sectioned list
 */
export function groupAddAccounts(
  existingAccounts: Account[],
  scannedAccounts: Account[],
  context: {
    scanning: boolean
  }
): AddAccountsSectionResult {
  const importedAccounts = [];
  const importableAccounts = [];
  const creatableAccounts = [];
  const migrateAccounts = [];
  let alreadyEmptyAccount;

  const scannedAccountsWithoutMigrate = [...scannedAccounts];
  existingAccounts.forEach(existingAccount => {
    const migrate = findAccountMigration(
      existingAccount,
      scannedAccountsWithoutMigrate
    );
    if (migrate) {
      migrateAccounts.push({
        ...migrate,
        name: existingAccount.name
      });
      const index = scannedAccountsWithoutMigrate.indexOf(migrate);
      if (index !== -1) {
        scannedAccountsWithoutMigrate[index] =
          scannedAccountsWithoutMigrate[
            scannedAccountsWithoutMigrate.length - 1
          ];
        scannedAccountsWithoutMigrate.pop();
      }
    }
  });

  scannedAccountsWithoutMigrate.forEach(acc => {
    const existingAccount = existingAccounts.find(a => a.id === acc.id);
    const empty = isAccountEmpty(acc);
    if (existingAccount) {
      if (empty) {
        alreadyEmptyAccount = existingAccount;
      }
      importedAccounts.push(existingAccount);
    } else if (empty) {
      creatableAccounts.push(acc);
    } else {
      importableAccounts.push(acc);
    }
  });

  const sections = [];

  if (importableAccounts.length) {
    sections.push({
      id: "importable",
      selectable: true,
      defaultSelected: true,
      data: importableAccounts
    });
  }
  if (migrateAccounts.length) {
    sections.push({
      id: "migrate",
      selectable: true,
      defaultSelected: true,
      data: migrateAccounts
    });
  }
  if (!context.scanning || creatableAccounts.length) {
    // NB if data is empty, need to do custom placeholder that depends on alreadyEmptyAccount
    sections.push({
      id: "creatable",
      selectable: true,
      defaultSelected: false,
      data: creatableAccounts
    });
  }

  if (importedAccounts.length) {
    sections.push({
      id: "imported",
      selectable: false,
      defaultSelected: false,
      data: importedAccounts
    });
  }

  return {
    sections,
    alreadyEmptyAccount
  };
}

export type AddAccountsProps = {
  existingAccounts: Account[],
  scannedAccounts: Account[],
  selectedIds: string[],
  renamings: { [_: string]: string }
};

export function addAccounts({
  scannedAccounts,
  existingAccounts,
  selectedIds,
  renamings
}: AddAccountsProps): Account[] {
  const newAccounts = [];

  // scanned accounts that was selected
  const selected = scannedAccounts.filter(a => selectedIds.includes(a.id));

  // we'll search for potential migration and append to newAccounts
  existingAccounts.forEach(existing => {
    const migration = findAccountMigration(existing, selected);
    if (migration) {
      if (!newAccounts.includes(migration)) {
        newAccounts.push(migration);
        const index = selected.indexOf(migration);
        if (index !== -1) {
          selected[index] = selected[selected.length - 1];
          selected.pop();
        }
      }
    } else {
      // we'll try to find an updated version of the existing account as opportunity to refresh the operations
      const update = selected.find(a => a.id === existing.id);
      if (update) {
        // preserve existing name
        newAccounts.push({ ...update, name: existing.name });
      } else {
        newAccounts.push(existing);
      }
    }
  });

  // append the new accounts
  selected.forEach(acc => {
    const alreadyThere = newAccounts.find(a => a.id === acc.id);
    if (!alreadyThere) {
      newAccounts.push(acc);
    }
  });

  // apply the renaming
  return newAccounts.map(a => {
    const name = validateNameEdition(a, renamings[a.id]);
    if (name) return { ...a, name };
    return a;
  });
}
