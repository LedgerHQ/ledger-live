import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  AleoAccount,
  AleoAccountRaw,
  AleoResources,
  AleoResourcesRaw,
  AleoTokenAccount,
  AleoTokenAccountRaw,
  AleoUnspentRecord,
} from "../../types";
import { getMockedCurrency, getMockedTokenCurrency } from "./currency.fixture";
import { getMockedRecord } from "./api.fixture";

const defaultMockedCurrency = getMockedCurrency();
const defaultBalance = new BigNumber(100000);
const defaultMockAccountId =
  "js:2:aleo:aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f::AViewKey123";

export const mockAleoResources = {
  transparentBalance: new BigNumber(1000),
  provableApi: {
    uuid: "uuid-1234",
    scannerStatus: {
      percentage: 50,
      synced: false,
    },
  },
  privateBalance: new BigNumber(1),
  unspentPrivateRecords: [],
  lastPrivateSyncDate: new Date(),
} satisfies AleoResources;

export const mockAleoResourcesRaw: AleoResourcesRaw = {
  transparentBalance: mockAleoResources.transparentBalance.toString(),
  provableApi: JSON.stringify(mockAleoResources.provableApi),
  privateBalance: mockAleoResources.privateBalance?.toString() ?? null,
  unspentPrivateRecords: JSON.stringify(mockAleoResources.unspentPrivateRecords),
  lastPrivateSyncDate: mockAleoResources.lastPrivateSyncDate?.toISOString() ?? null,
};

export const mockUnspentRecord1: AleoUnspentRecord = {
  ...getMockedRecord(),
  commitment: "record-1-commitment",
  microcredits: "800000",
  decryptedData: {
    owner: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f.private",
    data: { microcredits: "800000u64.private" },
    nonce: "7349790946519678882609199286010273702044020144797298963772495833343454197352group",
    version: 1,
  },
};

export const mockUnspentRecord2: AleoUnspentRecord = {
  ...getMockedRecord(),
  commitment: "record-2-commitment",
  microcredits: "600000",
  decryptedData: {
    owner: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f.private",
    data: { microcredits: "600000u64.private" },
    nonce: "7349790946519678882609199286010273702044020144797298963772495833343454197352group",
    version: 1,
  },
};

export const mockUnspentTokenRecord1: AleoUnspentRecord = {
  ...mockUnspentRecord1,
  commitment: "token-record-1-commitment",
};

export const mockUnspentTokenRecord2: AleoUnspentRecord = {
  ...mockUnspentRecord2,
  commitment: "token-record-2-commitment",
};

export const getMockedAccount = (overrides?: Partial<AleoAccount>): AleoAccount => {
  return {
    type: "Account",
    id: defaultMockAccountId,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
    freshAddressPath: "44'/683'/0'/0'",
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
    freshAddressPath: "44'/683'/0'/0'",
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
    ...overrides,
  };
};

export function getMockedTokenAccount(
  token: TokenCurrency = getMockedTokenCurrency(),
  overrides?: Partial<AleoTokenAccount>,
): AleoTokenAccount {
  const parentId = overrides?.parentId ?? defaultMockAccountId;
  const id = overrides?.id ?? encodeTokenAccountId(parentId, token);
  const balance = overrides?.balance ?? new BigNumber(500000);

  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance,
    spendableBalance: overrides?.spendableBalance ?? balance,
    creationDate: new Date(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    transparentBalance: overrides?.transparentBalance ?? balance,
    privateBalance: overrides?.privateBalance ?? null,
    unspentPrivateRecords: overrides?.unspentPrivateRecords ?? null,
    ...overrides,
  };
}

export function getMockedTokenAccountRaw(
  tokenAccount: AleoTokenAccount = getMockedTokenAccount(),
  overrides?: Partial<AleoTokenAccountRaw>,
): AleoTokenAccountRaw {
  return {
    type: "TokenAccountRaw",
    id: tokenAccount.id,
    parentId: tokenAccount.parentId,
    tokenId: tokenAccount.token.id,
    balance: tokenAccount.balance.toString(),
    spendableBalance: tokenAccount.spendableBalance.toString(),
    creationDate: tokenAccount.creationDate.toISOString(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: tokenAccount.balanceHistoryCache,
    swapHistory: [],
    transparentBalance: tokenAccount.transparentBalance.toString(),
    privateBalance: tokenAccount.privateBalance?.toString() ?? null,
    unspentPrivateRecords: tokenAccount.unspentPrivateRecords
      ? JSON.stringify(tokenAccount.unspentPrivateRecords)
      : null,
    ...overrides,
  };
}
