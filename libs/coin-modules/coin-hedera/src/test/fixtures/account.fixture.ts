import BigNumber from "bignumber.js";
import type {
  HederaAccount,
  HederaAccountRaw,
  HederaResources,
  HederaResourcesRaw,
} from "../../types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { getMockedCurrency, getMockedTokenCurrency } from "./currency.fixture";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

const defaultMockedCurrency = getMockedCurrency();
const defaultMockedTokenCurrency = getMockedTokenCurrency();
const defaultMockAccountId = "js:2:hedera:0.0.1234567:hederaBip44";
const defaultMockTokenAccountId = `${defaultMockAccountId}+${defaultMockedTokenCurrency.id}`;
const defaultBalance = new BigNumber(100000000);
const defaultTokenBalance = new BigNumber(10);

export const mockHederaResources: HederaResources = {
  maxAutomaticTokenAssociations: 0,
  isAutoTokenAssociationEnabled: false,
};

export const mockHederaResourcesRaw: HederaResourcesRaw = {
  maxAutomaticTokenAssociations: 0,
  isAutoTokenAssociationEnabled: false,
};

/**
 * default settings:
 * - account balance is 1 HBAR
 * - auto token association is disabled
 * - subAccounts array is empty (no tokens account are used)
 */
export const getMockedAccount = (overrides?: Partial<HederaAccount>): HederaAccount => {
  return {
    type: "Account",
    id: defaultMockAccountId,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "0.0.12345",
    freshAddressPath: "44/3030",
    used: false,
    balance: defaultBalance,
    spendableBalance: defaultBalance,
    creationDate: new Date(),
    blockHeight: 0,
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
    hederaResources: mockHederaResources,
    ...overrides,
  };
};

export const getMockedAccountRaw = (overrides?: Partial<HederaAccountRaw>): HederaAccountRaw => {
  return {
    id: defaultMockAccountId,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "0.0.12345",
    freshAddressPath: "44/3030",
    used: false,
    balance: defaultBalance.toString(),
    spendableBalance: defaultBalance.toString(),
    creationDate: new Date().toISOString(),
    blockHeight: 0,
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
    hederaResources: mockHederaResourcesRaw,
    ...overrides,
  };
};

/**
 * default settings:
 * - balance is 10
 */
export const getMockedTokenAccount = (
  token: TokenCurrency,
  overrides?: Partial<TokenAccount>,
): TokenAccount => {
  return {
    type: "TokenAccount",
    id: defaultMockTokenAccountId,
    parentId: defaultMockAccountId,
    token,
    balance: defaultTokenBalance,
    spendableBalance: defaultTokenBalance,
    creationDate: new Date(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    ...overrides,
  };
};
