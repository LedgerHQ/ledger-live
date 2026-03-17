import { act, renderHook } from "tests/testSetup";
import { usePortfolioBalance } from "../usePortfolioBalance";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { DEFAULT_PORTFOLIO_RANGE } from "LLD/utils/constants";
import { SYNC_SETTLE_GUARD_MS } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import * as portfolioReact from "@ledgerhq/live-countervalues-react/portfolio";
import { setLastUserSyncClickTimestamp } from "~/renderer/reducers/syncRefresh";
import { mockPoll, mockOnUserRefresh, mockBridgeSync, defaultPortfolio } from "./fixtures";

const mockTriggerRefresh = jest.fn(() => {
  mockOnUserRefresh();
  mockPoll();
  mockBridgeSync({
    type: "SYNC_ALL_ACCOUNTS",
    priority: 5,
    reason: "user-click",
  });
});

const mockUseSyncSources = jest.fn().mockReturnValue({
  isPending: false,
  stablePending: false,
  hasCvOrBridgeError: false,
  hasWalletSyncError: false,
  triggerRefresh: mockTriggerRefresh,
});

jest.mock("../useSyncSources", () => ({
  useSyncSources: () => mockUseSyncSources(),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useBatchAccountsSyncState: jest.fn(({ accounts }: { accounts: { id: string }[] }) =>
    accounts.map(account => ({ syncState: { pending: false, error: null }, account })),
  ),
}));

const defaultInitialState = {
  accounts: [],
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    selectedTimeRange: "day" as const,
  },
};

const syncingState = {
  isPending: true,
  stablePending: true,
  hasCvOrBridgeError: false,
  hasWalletSyncError: false,
  triggerRefresh: mockTriggerRefresh,
};

describe("usePortfolioBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
      ...defaultPortfolio,
      balanceAvailable: true,
    });
    mockUseSyncSources.mockReturnValue({
      isPending: false,
      stablePending: false,
      hasCvOrBridgeError: false,
      hasWalletSyncError: false,
      triggerRefresh: mockTriggerRefresh,
    });
  });

  describe("initial data shape", () => {
    it("should return portfolio data and sync phase", () => {
      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: defaultInitialState,
      });

      expect(result.current).toMatchObject({
        portfolio: expect.any(Object),
        counterValue: expect.anything(),
        balanceAvailable: true,
        isColdStart: false,
        isBalanceLoading: false,
        syncPhase: "synced",
      });
      expect(typeof result.current.handleSync).toBe("function");
    });

    it("should pass accounts from store to portfolio hook", () => {
      const spy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

      renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
        },
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ accounts: [BTC_ACCOUNT, ETH_ACCOUNT] }),
      );
    });
  });

  describe("portfolio range", () => {
    it("should use DEFAULT_PORTFOLIO_RANGE when legacyRange is false", () => {
      const spy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

      renderHook(() => usePortfolioBalance({ legacyRange: false }), {
        initialState: defaultInitialState,
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ range: DEFAULT_PORTFOLIO_RANGE }));
    });

    it("should use selectedTimeRange from store when legacyRange is true", () => {
      const spy = jest.spyOn(portfolioReact, "usePortfolioThrottled");

      renderHook(() => usePortfolioBalance({ legacyRange: true }), {
        initialState: {
          ...defaultInitialState,
          settings: { ...defaultInitialState.settings, selectedTimeRange: "week" },
        },
      });

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ range: "week" }));
    });
  });

  describe("balance and cold start", () => {
    it("should return isColdStart true when hasAccounts and balance is not yet available", () => {
      jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
        ...defaultPortfolio,
        balanceAvailable: false,
      });

      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
      });

      expect(result.current.isColdStart).toBe(true);
      expect(result.current.balanceAvailable).toBe(false);
    });
  });

  describe("sync phases and loading", () => {
    it("should return syncPhase syncing during initial loading", () => {
      mockUseSyncSources.mockReturnValue(syncingState);

      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          accounts: [BTC_ACCOUNT],
          syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
        },
      });

      expect(result.current.isBalanceLoading).toBe(true);
      expect(result.current.syncPhase).toBe("syncing");
    });

    it("should return syncPhase synced after initial sync completes", () => {
      jest.useFakeTimers();
      mockUseSyncSources.mockReturnValue(syncingState);

      const { result, rerender } = renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          accounts: [BTC_ACCOUNT],
          syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
        },
      });

      expect(result.current.syncPhase).toBe("syncing");

      mockUseSyncSources.mockReturnValue({
        isPending: false,
        stablePending: false,
        hasCvOrBridgeError: false,
        hasWalletSyncError: false,
        triggerRefresh: mockTriggerRefresh,
      });

      act(() => {
        rerender();
      });
      act(() => {
        jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS);
      });

      expect(result.current.syncPhase).toBe("synced");

      jest.useRealTimers();
    });

    it("should not show loading during auto-refresh (no recent user click)", () => {
      mockUseSyncSources.mockReturnValue(syncingState);

      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: true },
        },
      });

      expect(result.current.isBalanceLoading).toBe(false);
    });

    it("should show loading during manual refresh", () => {
      mockUseSyncSources.mockReturnValue(syncingState);

      const { result, store } = renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: true },
        },
      });

      expect(result.current.isBalanceLoading).toBe(false);

      act(() => {
        store.dispatch(setLastUserSyncClickTimestamp(Date.now()));
      });

      expect(result.current.isBalanceLoading).toBe(true);
      expect(result.current.syncPhase).toBe("syncing");
    });

    it("should not get stuck loading when sync is already done at mount (empty account)", () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: {
          ...defaultInitialState,
          accounts: [BTC_ACCOUNT],
          syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
        },
      });

      expect(result.current.isBalanceLoading).toBe(false);

      act(() => {
        jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS);
      });

      expect(result.current.syncPhase).toBe("synced");

      jest.useRealTimers();
    });
  });

  describe("error states", () => {
    it("should return syncPhase failed when has sync error after settle", () => {
      mockUseSyncSources.mockReturnValue({
        isPending: false,
        stablePending: false,
        hasCvOrBridgeError: true,
        hasWalletSyncError: false,
        triggerRefresh: mockTriggerRefresh,
      });

      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: defaultInitialState,
      });

      expect(result.current.syncPhase).toBe("failed");
    });
  });

  describe("handleSync", () => {
    it("should call all sync sources on handleSync", () => {
      const { result } = renderHook(() => usePortfolioBalance(), {
        initialState: defaultInitialState,
      });

      act(() => {
        result.current.handleSync();
      });

      expect(mockOnUserRefresh).toHaveBeenCalledTimes(1);
      expect(mockPoll).toHaveBeenCalledTimes(1);
      expect(mockBridgeSync).toHaveBeenCalledWith({
        type: "SYNC_ALL_ACCOUNTS",
        priority: 5,
        reason: "user-click",
      });
    });
  });
});
