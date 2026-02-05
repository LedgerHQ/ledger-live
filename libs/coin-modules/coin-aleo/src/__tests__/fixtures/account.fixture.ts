import BigNumber from "bignumber.js";
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../../types";
import { getMockedCurrency } from "./currency.fixture";

const defaultMockedCurrency = getMockedCurrency();
const defaultBalance = new BigNumber(100000);
const defaultMockAccountId =
  "js:2:aleo:aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f::AViewKey123";

export const mockAleoResources: AleoResources = {
  transparentBalance: new BigNumber(1000),
  privateBalance: new BigNumber(1),
  provableApi: {
    apiKey: "abc",
    consumerId: "consumer123",
    jwt: {
      token: "jwt_token",
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    uuid: "uuid-1234",
    scannerStatus: {
      percentage: 50,
      synced: false,
    },
  },
  privateRecordsHistory: [],
  unspentPrivateRecords: [],
  lastPrivateSyncDate: new Date(),
};

export const mockAleoResourcesRaw: AleoResourcesRaw = {
  transparentBalance: mockAleoResources.transparentBalance.toString(),
  privateBalance: mockAleoResources.privateBalance?.toString() ?? null,
  provableApi: JSON.stringify(mockAleoResources.provableApi),
  privateRecordsHistory: JSON.stringify(mockAleoResources.privateRecordsHistory),
  unspentPrivateRecords: JSON.stringify(mockAleoResources.unspentPrivateRecords),
  lastPrivateSyncDate: mockAleoResources.lastPrivateSyncDate?.toISOString() ?? null,
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
