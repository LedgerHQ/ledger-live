// TODO rewrite the test

import type { AccountRaw } from "@ledgerhq/types-live";
import {
  flattenSortAccounts,
  nestedSortAccounts,
  sortAccountsComparatorFromOrder,
  type AccountComparator,
} from "./ordering";
import { fromAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization/account";
import type { AccountNamesState } from "@domain/entity-account-name";
import { parseAnyAccountId } from "@shared/schema-primitives";
import { accountRawToAccountUserData } from "./serialization";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

const raws: AccountRaw[] = [
  <AccountRaw>{
    id: "ethereumjs:2:ethereum:0x01:",
    seedIdentifier: "0x01",
    name: "A",
    derivationMode: "",
    index: 0,
    freshAddress: "0x01",
    freshAddressPath: "44'/60'/0'/0/0",
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    lastSyncDate: "2019-07-17T15:13:30.318Z",
    balance: "1000000000000000000",
  },
  <AccountRaw>{
    id: "ethereumjs:2:ethereum:0x02:",
    seedIdentifier: "0x02",
    name: "B",
    derivationMode: "",
    index: 1,
    freshAddress: "0x02",
    freshAddressPath: "44'/60'/1'/0/0",
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    lastSyncDate: "2019-07-17T15:13:29.306Z",
    balance: "2000000000000000000",
  },
  <AccountRaw>{
    id: "libcore:1:ethereum:xpub3:",
    seedIdentifier: "seed",
    name: "C",
    derivationMode: "",
    index: 2,
    freshAddress: "0x03",
    freshAddressPath: "44'/60'/2'/0/0",
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    lastSyncDate: "2019-07-17T15:13:29.306Z",
    balance: "3000000000000000000",
  },
  <AccountRaw>{
    id: "libcore:1:ethereum:xpub3B:",
    seedIdentifier: "seed",
    name: "CA",
    derivationMode: "",
    index: 2,
    freshAddress: "0x03",
    freshAddressPath: "44'/60'/2'/0/0",
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    lastSyncDate: "2019-07-17T15:13:29.306Z",
    balance: "3000000000000000000",
  },
  <AccountRaw>{
    id: "libcore:1:ethereum:xpub1B:",
    seedIdentifier: "seed",
    name: "AA",
    derivationMode: "",
    index: 2,
    freshAddress: "0x03",
    freshAddressPath: "44'/60'/2'/0/0",
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    lastSyncDate: "2019-07-17T15:13:29.306Z",
    balance: "4000000000000000000",
  },
];

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "0",
});

let accounts: Awaited<ReturnType<typeof fromAccountRaw>>[];
const accountNames: AccountNamesState = new Map();

beforeAll(async () => {
  accounts = await Promise.all(raws.map(a => fromAccountRaw(a)));

  for (const raw of raws) {
    const r = accountRawToAccountUserData(raw);
    accountNames.set(parseAnyAccountId(r.id), r.name);
  }
});

const mockedCalculateCountervalue = <T>(_: unknown, balance: T): T => balance;

test("Accounts ordering | name asc", () => {
  const compareFn = sortAccountsComparatorFromOrder(
    "name|asc",
    accountNames,
    mockedCalculateCountervalue,
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map(a => accountNames.get(parseAnyAccountId(a.id)) || "")).toEqual([
    "A",
    "AA",
    "B",
    "C",
    "CA",
  ]);
});
test("Accounts ordering | name desc", () => {
  const compareFn = sortAccountsComparatorFromOrder(
    "name|desc",
    accountNames,
    mockedCalculateCountervalue,
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map(a => accountNames.get(parseAnyAccountId(a.id)) || "")).toEqual([
    "CA",
    "C",
    "B",
    "AA",
    "A",
  ]);
});
test("Accounts ordering | balance asc", () => {
  const compareFn = sortAccountsComparatorFromOrder(
    "balance|asc",
    accountNames,
    mockedCalculateCountervalue,
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map(a => accountNames.get(parseAnyAccountId(a.id)) || "")).toEqual([
    "A",
    "B",
    "C",
    "CA",
    "AA",
  ]);
});
test("Accounts ordering | balance desc", () => {
  const compareFn = sortAccountsComparatorFromOrder(
    "balance|desc",
    accountNames,
    mockedCalculateCountervalue,
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map(a => accountNames.get(parseAnyAccountId(a.id)) || "")).toEqual([
    "AA",
    "C",
    "CA",
    "B",
    "A",
  ]);
});

const byName: AccountComparator = (a, b) =>
  (accountNames.get(parseAnyAccountId(a.id)) || "").localeCompare(
    accountNames.get(parseAnyAccountId(b.id)) || "",
  );

test("flattenSortAccounts", () => {
  expect(
    flattenSortAccounts(accounts, byName).map(a => accountNames.get(parseAnyAccountId(a.id))),
  ).toEqual(["A", "AA", "B", "C", "CA"]);
});

test("nestedSortAccounts keeps the same reference when the order is already correct", () => {
  const sorted = nestedSortAccounts(accounts, byName);
  expect(sorted.map(a => accountNames.get(parseAnyAccountId(a.id)))).toEqual([
    "A",
    "AA",
    "B",
    "C",
    "CA",
  ]);
  expect(nestedSortAccounts(sorted, byName)).toBe(sorted);
});
