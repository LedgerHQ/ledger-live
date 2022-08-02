import type { AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw, sortAccountsComparatorFromOrder } from "../../account";
const accounts = [
  <AccountRaw>{
    id: "ethereumjs:2:ethereum:0x01:",
    seedIdentifier: "0x01",
    name: "A",
    derivationMode: "",
    index: 0,
    freshAddress: "0x01",
    freshAddressPath: "44'/60'/0'/0/0",
    freshAddresses: [],
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
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
    freshAddresses: [],
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
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
    freshAddresses: [],
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
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
    freshAddresses: [],
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
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
    freshAddresses: [],
    blockHeight: 8168983,
    operations: [],
    pendingOperations: [],
    currencyId: "ethereum",
    unitMagnitude: 18,
    lastSyncDate: "2019-07-17T15:13:29.306Z",
    balance: "4000000000000000000",
  },
].map(fromAccountRaw);

const mockedCalculateCountervalue = (_, balance) => balance;

test("Accounts ordering | name asc", () => {
  const compareFn = sortAccountsComparatorFromOrder(
    "name|asc",
    mockedCalculateCountervalue
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map((a) => a.name)).toEqual([
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
    mockedCalculateCountervalue
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map((a) => a.name)).toEqual([
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
    mockedCalculateCountervalue
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map((a) => a.name)).toEqual([
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
    mockedCalculateCountervalue
  );
  const sortedAccounts = accounts.sort(compareFn);
  expect(sortedAccounts.map((a) => a.name)).toEqual([
    "AA",
    "C",
    "CA",
    "B",
    "A",
  ]);
});
