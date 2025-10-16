import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import BigNumber from "bignumber.js";

// Mock the CantonOnboardResult type since it's not available in the test environment
export type CantonOnboardResult = {
  account: Account;
  partyId: string;
};

export const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  type: "Account",
  id: "test-account-id",
  currency: {
    type: "CryptoCurrency",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: "canton" as any,
    name: "Canton",
    ticker: "CANTON",
    units: [],
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    color: "#000000",
    family: "canton",
    blockAvgTime: 5,
    supportsSegwit: false,
    supportsNativeSegwit: false,
    explorerViews: [],
  },
  balance: new BigNumber("0"),
  spendableBalance: new BigNumber("0"),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  blockHeight: 0,
  freshAddress: "test-address",
  freshAddressPath: "44'/60'/0'/0/0",
  swapHistory: [],
  index: 0,
  derivationMode: "",
  used: false,
  seedIdentifier: "test-seed-identifier",
  creationDate: new Date(),
  balanceHistoryCache: {
    HOUR: { latestDate: null, balances: [] },
    DAY: { latestDate: null, balances: [] },
    WEEK: { latestDate: null, balances: [] },
  },
  ...overrides,
});

export const createMockCurrency = (
  overrides: Partial<CryptoOrTokenCurrency> = {},
): CryptoOrTokenCurrency =>
  ({
    type: "CryptoCurrency",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: "canton" as any,
    name: "Canton",
    ticker: "CANTON",
    units: [],
    managerAppName: "Canton",
    coinType: 60,
    scheme: "canton",
    color: "#000000",
    family: "canton",
    blockAvgTime: 5,
    supportsSegwit: false,
    supportsNativeSegwit: false,
    explorerViews: [],
    ...overrides,
  }) as CryptoOrTokenCurrency;

export const createMockDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "test-device-id",
  deviceName: "Test Device",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelId: "nanoSP" as any,
  wired: false,
  ...overrides,
});

export const createMockOnboardResult = (
  overrides: Partial<CantonOnboardResult> = {},
): CantonOnboardResult => ({
  account: createMockAccount(),
  partyId: "test-party-id",
  ...overrides,
});

export const createMockRouteParams = (overrides: Record<string, unknown> = {}) => ({
  accountsToAdd: [createMockAccount()],
  currency: createMockCurrency(),
  ...overrides,
});

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  getParent: jest.fn(() => ({
    navigate: jest.fn(),
  })),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(),
  getId: jest.fn(),
  getCurrentRoute: jest.fn(),
});
