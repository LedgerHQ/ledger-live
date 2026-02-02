import BigNumber from "bignumber.js";
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../../types";
import { getMockedCurrency } from "./currency.fixture";

const defaultMockedCurrency = getMockedCurrency();
const defaultBalance = new BigNumber(100000);
const defaultMockAccountId =
  "js:2:aleo:aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f::AViewKey123";

export const mockAleoResources: AleoResources = {
  transparentBalance: new BigNumber(0),
  privateBalance: null,
  provableApi: null,
  privateRecords: null,
  lastPrivateSyncDate: null,
};

export const mockAleoResourcesRaw: AleoResourcesRaw = {
  transparentBalance: "0",
  privateBalance: null,
  provableApi: null,
  privateRecords: null,
  lastPrivateSyncDate: null,
};

export const getMockedAccount = (overrides?: Partial<AleoAccount>): AleoAccount => {
  return {
    type: "Account",
    id: defaultMockAccountId,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
    freshAddressPath: "44'/683'/0'/0/0",
    used: false,
    balance: defaultBalance,
    spendableBalance: defaultBalance,
    creationDate: new Date(),
    blockHeight: 1234,
    currency: defaultMockedCurrency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
    aleoResources: mockAleoResources,
    ...overrides,
  };
};

export const getMockedAccountRaw = (overrides?: Partial<AleoAccountRaw>): AleoAccountRaw => {
  return {
    id: defaultMockAccountId,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
    freshAddressPath: "44'/683'/0'/0/0",
    used: false,
    balance: defaultBalance.toString(),
    spendableBalance: defaultBalance.toString(),
    creationDate: new Date().toISOString(),
    blockHeight: 1234,
    currencyId: defaultMockedCurrency.id,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date().toISOString(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
    aleoResources: mockAleoResourcesRaw,
    ...overrides,
  };
};
