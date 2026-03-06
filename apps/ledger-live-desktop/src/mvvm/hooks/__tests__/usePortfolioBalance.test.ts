import { act, renderHook } from "tests/testSetup";
import { usePortfolioBalance } from "../usePortfolioBalance";
import { BTC_ACCOUNT, ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import * as walletSyncContext from "LLD/features/WalletSync/components/WalletSyncContext";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { DEFAULT_PORTFOLIO_RANGE, POLLING_FINISHED_DELAY_MS } from "LLD/utils/constants";
import { SYNC_SETTLE_GUARD_MS } from "../useSyncLifecycle";
import * as portfolioReact from "@ledgerhq/live-countervalues-react/portfolio";
import * as countervaluesReact from "@ledgerhq/live-countervalues-react";
import * as bridgeReact from "@ledgerhq/live-common/bridge/react/index";
import { setLastUserSyncClickTimestamp } from "~/renderer/reducers/syncRefresh";
import {
  mockPoll,
  mockOnUserRefresh,
  mockBridgeSync,
  defaultPollingReturn,
  defaultWalletSyncReturn,
  defaultPortfolio,
} from "./fixtures";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useBridgeSync: jest.fn(),
  useGlobalSyncState: jest.fn(),
  useBatchAccountsSyncState: jest.fn(({ accounts }: { accounts: { id: string }[] }) =>
    accounts.map(account => ({ syncState: { pending: false, error: null }, account })),
  ),
}));

jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  ...jest.requireActual("LLD/features/WalletSync/components/WalletSyncContext"),
  useWalletSyncUserState: jest.fn(),
}));

const mockUseBridgeSync = jest.mocked(bridgeReact.useBridgeSync);
const mockUseGlobalSyncState = jest.mocked(bridgeReact.useGlobalSyncState);
const mockUseWalletSyncUserState = jest.mocked(walletSyncContext.useWalletSyncUserState);

const defaultInitialState = {
  accounts: [],
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    selectedTimeRange: "day" as const,
  },
};

describe("usePortfolioBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(portfolioReact, "usePortfolioThrottled").mockReturnValue({
      ...defaultPortfolio,
      balanceAvailable: true,
    });
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue(defaultPollingReturn);
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
    mockUseBridgeSync.mockReturnValue(mockBridgeSync);
    mockUseWalletSyncUserState.mockReturnValue(defaultWalletSyncReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it("should return syncPhase syncing during initial loading", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

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
    const pollingMock = jest
      .spyOn(countervaluesReact, "useCountervaluesPolling")
      .mockReturnValue({ ...defaultPollingReturn, pending: true });

    const { result, rerender } = renderHook(() => usePortfolioBalance(), {
      initialState: {
        ...defaultInitialState,
        accounts: [BTC_ACCOUNT],
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
      },
    });

    expect(result.current.syncPhase).toBe("syncing");

    pollingMock.mockReturnValue({ ...defaultPollingReturn, pending: false });
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });

    act(() => {
      rerender();
    });

    act(() => {
      jest.advanceTimersByTime(POLLING_FINISHED_DELAY_MS);
    });

    // FSM defers the syncing → synced transition by a settle guard.
    act(() => {
      jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS);
    });

    expect(result.current.syncPhase).toBe("synced");

    jest.useRealTimers();
  });

  it("should not show loading during auto-refresh (no recent user click)", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

    const { result } = renderHook(() => usePortfolioBalance(), {
      initialState: {
        ...defaultInitialState,
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: true },
      },
    });

    expect(result.current.isBalanceLoading).toBe(false);
  });

  it("should show loading during manual refresh", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

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

  it("should return syncPhase failed when CV has error after settle", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      error: new Error("CV error"),
    });

    const { result } = renderHook(() => usePortfolioBalance(), {
      initialState: defaultInitialState,
    });

    expect(result.current.syncPhase).toBe("failed");
  });

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
