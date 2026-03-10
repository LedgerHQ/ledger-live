import type { Portfolio, PortfolioRange } from "@ledgerhq/types-live";
import type { SyncPhase } from "../useSyncLifecycle";

// --- Sync source mock functions ---

export const mockPoll = jest.fn();
export const mockOnUserRefresh = jest.fn();
export const mockBridgeSync = jest.fn();

export const defaultPollingReturn = {
  poll: mockPoll,
  pending: false,
  error: null,
  wipe: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

export const defaultWalletSyncReturn = {
  onUserRefresh: mockOnUserRefresh,
  visualPending: false,
  walletSyncError: null,
};

// --- Portfolio data ---

const dayRange: PortfolioRange = "day";

export const mockCounterValue = {
  type: "FiatCurrency" as const,
  ticker: "USD",
  name: "US Dollar",
  units: [{ name: "US Dollar", code: "$", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

export const defaultPortfolio: Portfolio = {
  balanceHistory: [],
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: dayRange,
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange: { percentage: 0, value: 0 },
};

// --- usePortfolioBalance mock return ---

export function makePortfolioBalanceReturn(overrides?: Partial<ReturnType<typeof getDefault>>) {
  return { ...getDefault(), ...overrides };
}

function getDefault() {
  return {
    portfolio: defaultPortfolio,
    counterValue: mockCounterValue,
    balanceAvailable: true,
    syncPhase: "synced" as SyncPhase,
    isBalanceLoading: false,
    isColdStart: false,
    allAccounts: [] as never[],
    listOfErrorAccountNames: "",
    areAllAccountsUpToDate: true,
    hasAccounts: true,
    handleSync: jest.fn(),
  };
}
