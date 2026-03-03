import { act, renderHook } from "tests/testSetup";
import { usePortfolioBalanceSync } from "../usePortfolioBalanceSync";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import * as walletSyncContext from "LLD/features/WalletSync/components/WalletSyncContext";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { DEFAULT_PORTFOLIO_RANGE } from "LLD/utils/constants";
import type { PortfolioRange } from "@ledgerhq/types-live";
import * as portfolioReact from "@ledgerhq/live-countervalues-react/portfolio";
import * as countervaluesReact from "@ledgerhq/live-countervalues-react";
import * as bridgeReact from "@ledgerhq/live-common/bridge/react/index";

const dayRange: PortfolioRange = "day";

const mockPoll = jest.fn();
const mockOnUserRefresh = jest.fn();
const mockBridgeSync = jest.fn();

// Bridge and WalletSync: spyOn fails (Cannot redefine property), so we override only the hooks we need
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useBridgeSync: jest.fn(),
  useGlobalSyncState: jest.fn(),
}));

jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  ...jest.requireActual("LLD/features/WalletSync/components/WalletSyncContext"),
  useWalletSyncUserState: jest.fn(),
}));

const mockUseBridgeSync = jest.mocked(bridgeReact.useBridgeSync);
const mockUseGlobalSyncState = jest.mocked(bridgeReact.useGlobalSyncState);
const mockUseWalletSyncUserState = jest.mocked(walletSyncContext.useWalletSyncUserState);

const defaultPollingReturn = {
  poll: mockPoll,
  pending: false,
  error: null,
  wipe: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const defaultPortfolio = {
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

const defaultInitialState = {
  accounts: [],
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    selectedTimeRange: dayRange,
  },
};

describe("usePortfolioBalanceSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
      ...defaultPortfolio,
      balanceAvailable: true,
    });
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
    });
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
    mockUseBridgeSync.mockReturnValue(mockBridgeSync);
    mockUseWalletSyncUserState.mockReturnValue({
      onUserRefresh: mockOnUserRefresh,
      visualPending: false,
      walletSyncError: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns portfolio, counterValue, balance state, and triggerRefresh", () => {
    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current).toMatchObject({
      portfolio: expect.any(Object),
      counterValue: expect.anything(),
      balanceAvailable: true,
      isColdStart: false,
      isBalanceLoading: false,
      isManualRefreshLoading: false,
      stableSyncPending: false,
      hasCvOrBridgeError: false,
      hasWalletSyncError: false,
    });
    expect(typeof result.current.triggerRefresh).toBe("function");
  });

  it("uses DEFAULT_PORTFOLIO_RANGE when legacyRange is false", () => {
    const usePortfolioThrottledSpy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

    renderHook(() => usePortfolioBalanceSync({ legacyRange: false }), {
      initialState: defaultInitialState,
    });

    expect(usePortfolioThrottledSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        range: DEFAULT_PORTFOLIO_RANGE,
      }),
    );
  });

  it("uses selectedTimeRange from store when legacyRange is true", () => {
    const usePortfolioThrottledSpy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

    renderHook(() => usePortfolioBalanceSync({ legacyRange: true }), {
      initialState: {
        ...defaultInitialState,
        settings: {
          ...defaultInitialState.settings,
          selectedTimeRange: "week",
        },
      },
    });

    expect(usePortfolioThrottledSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        range: "week",
      }),
    );
  });

  it("returns isColdStart true when hasAccounts and balance is not yet available", () => {
    jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
      ...defaultPortfolio,
      balanceAvailable: false,
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isColdStart).toBe(true);
    expect(result.current.balanceAvailable).toBe(false);
  });

  it("returns isColdStart false when no accounts", () => {
    jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
      ...defaultPortfolio,
      balanceAvailable: false,
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isColdStart).toBe(false);
  });

  it("returns isBalanceLoading false and isManualRefreshLoading false when sync pending but no recent user click (auto refresh)", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: {
        ...defaultInitialState,
        syncRefresh: { lastUserSyncClickTimestamp: 0 },
      },
    });

    expect(result.current.stableSyncPending).toBe(true);
    expect(result.current.isManualRefreshLoading).toBe(false);
    expect(result.current.isBalanceLoading).toBe(false);
  });

  it("returns isManualRefreshLoading true and isBalanceLoading true when sync pending and user clicked recently", () => {
    const now = 10_000;
    const recentClickTime = now - 100; // 100ms ago within USER_CLICK_SPIN_DURATION_MS (1000)
    jest.spyOn(Date, "now").mockReturnValue(now);
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: {
        ...defaultInitialState,
        syncRefresh: { lastUserSyncClickTimestamp: recentClickTime },
      },
    });

    expect(result.current.stableSyncPending).toBe(true);
    expect(result.current.isManualRefreshLoading).toBe(true);
    expect(result.current.isBalanceLoading).toBe(true);
  });

  it("returns hasCvOrBridgeError true when not pending and cvPolling has error", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      error: new Error("CV error"),
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current.hasCvOrBridgeError).toBe(true);
  });

  it("returns hasCvOrBridgeError true when not pending and globalSyncState has error", () => {
    mockUseGlobalSyncState.mockReturnValue({
      pending: false,
      error: new Error("Sync error"),
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current.hasCvOrBridgeError).toBe(true);
  });

  it("returns hasCvOrBridgeError false when sync is still pending", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
      error: new Error("CV error"),
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current.hasCvOrBridgeError).toBe(false);
  });

  it("returns hasWalletSyncError true when wallet sync has error", () => {
    mockUseWalletSyncUserState.mockReturnValue({
      onUserRefresh: mockOnUserRefresh,
      visualPending: false,
      walletSyncError: new Error("Wallet sync failed"),
    });

    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    expect(result.current.hasWalletSyncError).toBe(true);
  });

  it("triggerRefresh calls onUserRefresh, poll, and bridgeSync with SYNC_ALL_ACCOUNTS", () => {
    const { result } = renderHook(() => usePortfolioBalanceSync(), {
      initialState: defaultInitialState,
    });

    act(() => {
      result.current.triggerRefresh();
    });

    expect(mockOnUserRefresh).toHaveBeenCalledTimes(1);
    expect(mockPoll).toHaveBeenCalledTimes(1);
    expect(mockBridgeSync).toHaveBeenCalledWith({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
  });

  it("passes accounts from store to portfolio hook", () => {
    const usePortfolioThrottledSpy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

    renderHook(() => usePortfolioBalanceSync(), {
      initialState: {
        ...defaultInitialState,
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
      },
    });

    expect(usePortfolioThrottledSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
      }),
    );
  });
});
