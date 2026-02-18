import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useActivityIndicator } from "../useActivityIndicator";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

const mockTriggerRefresh = jest.fn();

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
  usePortfolioSyncStatus: jest.fn(),
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

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const mockAccount = genAccount("btc-1", { currency: bitcoinCurrency });

function setDefaultMocks() {
  mockUsePortfolioBalanceSync.mockReturnValue(defaultPortfolioBalanceSync);
}

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

  it("returns isRotating true when countervalues polling is pending", () => {
    mockUseCountervaluesPolling.mockReturnValue({ ...defaultCVPolling, pending: true });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.isDisabled).toBe(true);
  });

  it("returns isRotating true on cold start when portfolio balance is not available", () => {
    mockUsePortfolioSyncStatus.mockReturnValue({ isColdStart: true });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
    expect(result.current.tooltip).toBeNull();
  });

  it("returns isRotating true when global sync state is pending", () => {
    mockUseGlobalSyncState.mockReturnValue({ pending: true, error: null });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
  });

  it("returns isRotating true when wallet sync visualPending is true (even without user click)", () => {
    mockUseWalletSyncUserState.mockReturnValue({
      visualPending: true,
      walletSyncError: null,
      onUserRefresh: mockOnUserRefresh,
    });

    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(true);
  });

  it("returns isRotating true after user click even when sync is not pending", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isRotating).toBe(false);

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
    expect(track).toHaveBeenCalledWith("SyncRefreshClick");
  });
});
