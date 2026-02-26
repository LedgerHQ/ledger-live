import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useActivityIndicator } from "../useActivityIndicator";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const mockBridgeSync = jest.fn();
const mockCvPoll = jest.fn();
const mockOnUserRefresh = jest.fn();

// Bridge: useActivityIndicator + useAccountsSyncStatus both use this package
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: jest.fn(() => mockBridgeSync),
  useGlobalSyncState: jest.fn(() => ({ pending: false, error: null })),
  useBatchAccountsSyncState: jest.fn(({ accounts }: { accounts: { id: string }[] }) =>
    accounts.map(account => ({ syncState: { pending: false, error: null }, account })),
  ),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-countervalues-react")>(
    "@ledgerhq/live-countervalues-react",
  ),
  useCountervaluesPolling: jest.fn(() => ({
    pending: false,
    error: null,
    poll: mockCvPoll,
    start: jest.fn(),
    stop: jest.fn(),
    wipe: jest.fn(),
  })),
}));

jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: jest.fn(() => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: mockOnUserRefresh,
  })),
}));

jest.mock("LLD/hooks/usePortfolioSyncStatus", () => ({
  usePortfolioSyncStatus: jest.fn(() => ({ isColdStart: false })),
}));

const mockUseGlobalSyncState = jest.requireMock(
  "@ledgerhq/live-common/bridge/react/index",
).useGlobalSyncState;
const mockUseCountervaluesPolling = jest.requireMock(
  "@ledgerhq/live-countervalues-react",
).useCountervaluesPolling;
const mockUseWalletSyncUserState = jest.requireMock(
  "LLD/features/WalletSync/components/WalletSyncContext",
).useWalletSyncUserState;
const mockUsePortfolioSyncStatus = jest.requireMock(
  "LLD/hooks/usePortfolioSyncStatus",
).usePortfolioSyncStatus;

const defaultInitialState: { accounts: unknown[] } = { accounts: [] };

describe("useActivityIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
    mockUseCountervaluesPolling.mockReturnValue({
      pending: false,
      error: null,
      poll: mockCvPoll,
      start: jest.fn(),
      stop: jest.fn(),
      wipe: jest.fn(),
    });
    mockUseWalletSyncUserState.mockReturnValue({
      visualPending: false,
      walletSyncError: null,
      onUserRefresh: mockOnUserRefresh,
    });
    mockUsePortfolioSyncStatus.mockReturnValue({ isColdStart: false });
  });

  it("returns hasAccounts, handleSync, isError, isRotating, tooltip, icon", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current).toMatchObject({
      hasAccounts: true,
      isError: false,
      isRotating: false,
    });
    expect(result.current.tooltip).toBeDefined();
    expect(typeof result.current.tooltip).toBe("string");
    expect(result.current.handleSync).toBeDefined();
    expect(result.current.icon).toBe(Refresh);
  });

  it("returns isRotating false when only countervalues polling is pending (no user click)", () => {
    mockUseCountervaluesPolling.mockReturnValue({
      pending: true,
      error: null,
      poll: mockCvPoll,
      start: jest.fn(),
      stop: jest.fn(),
      wipe: jest.fn(),
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(false);
  });

  it("returns isRotating true on cold start when portfolio balance is not available", () => {
    mockUsePortfolioSyncStatus.mockReturnValue({ isColdStart: true });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.tooltip).toBeNull();
  });

  it("returns isRotating false when only global sync state is pending (no user click)", () => {
    mockUseGlobalSyncState.mockReturnValue({ pending: true, error: null });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(false);
  });

  it("returns isRotating false when only wallet sync visualPending is true (no user click)", () => {
    mockUseWalletSyncUserState.mockReturnValue({
      visualPending: true,
      walletSyncError: null,
      onUserRefresh: mockOnUserRefresh,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(false);
  });

  it("returns isRotating false after user click when sync is not pending", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(false);

    act(() => {
      result.current.handleSync();
    });

    expect(result.current.isRotating).toBe(false);
  });

  it("handleSync calls onUserRefresh, cvPolling.poll, bridgeSync and track", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });
    const { track } = jest.requireMock("~/renderer/analytics/segment");

    act(() => {
      result.current.handleSync();
    });

    expect(mockOnUserRefresh).toHaveBeenCalledTimes(1);
    expect(mockCvPoll).toHaveBeenCalledTimes(1);
    expect(mockBridgeSync).toHaveBeenCalledWith({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
    expect(track).toHaveBeenCalledWith("SyncRefreshClick");
  });
});
