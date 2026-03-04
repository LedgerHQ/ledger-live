import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useActivityIndicator } from "../useActivityIndicator";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import * as segment from "~/renderer/analytics/segment";

const mockTriggerRefresh = jest.fn();

const defaultPortfolioBalanceSync = {
  isBalanceLoading: false,
  stableSyncPending: false,
  hasCvOrBridgeError: false,
  hasWalletSyncError: false,
  triggerRefresh: mockTriggerRefresh,
};

jest.mock("LLD/hooks/usePortfolioBalanceSync", () => ({
  usePortfolioBalanceSync: jest.fn(() => defaultPortfolioBalanceSync),
}));

const mockUsePortfolioBalanceSync = jest.requireMock(
  "LLD/hooks/usePortfolioBalanceSync",
).usePortfolioBalanceSync;

// Bridge: useActivityIndicator + useAccountsSyncStatus both use this package
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: jest.fn(),
  useGlobalSyncState: jest.fn(() => ({ pending: false, error: null })),
  useBatchAccountsSyncState: jest.fn(({ accounts }: { accounts: { id: string }[] }) =>
    accounts.map(account => ({ syncState: { pending: false, error: null }, account })),
  ),
}));

const defaultInitialState: { accounts: unknown[] } = { accounts: [] };

describe("useActivityIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceSync.mockReturnValue(defaultPortfolioBalanceSync);
  });

  it("returns correct values", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current).toMatchObject({
      hasAccounts: true,
      isError: false,
      isRotating: false,
      isDisabled: false,
    });
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
    expect(result.current.handleSync).toBeDefined();
    expect(result.current.icon).toBe(Refresh);
    expect(result.current.onTooltipShow).toBeUndefined();
  });

  it("returns onTooltipShow when isError is true", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      hasWalletSyncError: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isError).toBe(true);
    expect(typeof result.current.onTooltipShow).toBe("function");
  });

  it("onTooltipShow tracks SyncErrorList with currencies as array", () => {
    const trackSpy = jest.spyOn(segment, "track");
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      hasWalletSyncError: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    act(() => {
      result.current.onTooltipShow?.();
    });

    expect(trackSpy).toHaveBeenCalledWith(
      "SyncErrorList",
      expect.objectContaining({
        page: "/",
        currencies: expect.any(Array),
      }),
    );
    trackSpy.mockRestore();
  });

  it("returns isRotating and isDisabled true when balance is loading (e.g. countervalues polling)", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.isDisabled).toBe(true);
  });

  it("returns isRotating true on cold start when portfolio balance is not available", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.tooltip).toBeNull();
  });

  it("returns isRotating true when sync is pending", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      stableSyncPending: true,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
  });

  it("returns isRotating true after user click when sync is pending", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultPortfolioBalanceSync,
      stableSyncPending: true,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);

    act(() => {
      result.current.handleSync();
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.isDisabled).toBe(true);
  });

  it("handleSync calls triggerRefresh and track", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });
    const { track } = jest.requireMock("~/renderer/analytics/segment");

    act(() => {
      result.current.handleSync();
    });

    expect(mockTriggerRefresh).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("SyncRefreshClick", {
      triggered_after_sync_error: false,
    });
  });

  it("handleSync dispatches setLastUserSyncClickTimestamp", () => {
    const before = Date.now();
    const { result, store } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    act(() => {
      result.current.handleSync();
    });

    const after = Date.now();
    const lastUserSyncClickTimestamp = store.getState().syncRefresh.lastUserSyncClickTimestamp;
    expect(lastUserSyncClickTimestamp).toBeGreaterThanOrEqual(before);
    expect(lastUserSyncClickTimestamp).toBeLessThanOrEqual(after);
  });
});
