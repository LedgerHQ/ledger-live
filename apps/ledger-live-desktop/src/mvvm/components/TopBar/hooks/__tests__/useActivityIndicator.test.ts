import BigNumber from "bignumber.js";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, act } from "tests/testSetup";
import { useActivityIndicator } from "../useActivityIndicator";

jest.mock("../useAccountsSyncStatus");
jest.mock("../useActivityIndicatorTooltip");
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => jest.fn(),
  useGlobalSyncState: () => ({ pending: false, error: null }),
}));
jest.mock("@ledgerhq/live-countervalues-react", () => {
  const actual = jest.requireActual<typeof import("@ledgerhq/live-countervalues-react")>(
    "@ledgerhq/live-countervalues-react",
  );
  return {
    ...actual,
    useCountervaluesPolling: () => ({ pending: false, error: null, poll: jest.fn() }),
  };
});
jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: () => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: jest.fn(),
  }),
}));
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: (key: string) => {
    if (key === "PLAYWRIGHT_RUN") return false;
    if (key === "API_CELO_NODE") return "https://forno.celo.org";
    return "";
  },
  changes: { subscribe: jest.fn() },
}));

const mockUseAccountsSyncStatus = jest.requireMock(
  "../useAccountsSyncStatus",
).useAccountsSyncStatus;
const mockUseActivityIndicatorTooltip = jest.requireMock(
  "../useActivityIndicatorTooltip",
).useActivityIndicatorTooltip;

const getDefaultInitialState = (overrides: Record<string, unknown> = {}) => ({
  accounts: [],
  ...overrides,
});

const mockAccount = {
  id: "a1",
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  swapHistory: [],
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  lastSyncDate: new Date(),
  currency: {
    id: "bitcoin",
    type: "CryptoCurrency",
    ticker: "BTC",
    name: "Bitcoin",
    family: "bitcoin",
    blockAvgTime: 10 * 60,
  },
};

describe("useActivityIndicator", () => {
  const mockBridgeSync = jest.fn();
  const mockCvPoll = jest.fn();
  const mockOnUserRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock("@ledgerhq/live-common/bridge/react/index").useBridgeSync = () =>
      mockBridgeSync;
    jest.requireMock("@ledgerhq/live-countervalues-react").useCountervaluesPolling = () => ({
      pending: false,
      error: null,
      poll: mockCvPoll,
    });
    jest.requireMock(
      "LLD/features/WalletSync/components/WalletSyncContext",
    ).useWalletSyncUserState = () => ({
      visualPending: false,
      walletSyncError: null,
      onUserRefresh: mockOnUserRefresh,
    });
    mockUseAccountsSyncStatus.mockReturnValue({
      allAccounts: [{ id: "a1", lastSyncDate: new Date(), currency: { ticker: "BTC" } }],
      listOfErrorAccountNames: "",
      areAllAccountsUpToDate: true,
    });
    mockUseActivityIndicatorTooltip.mockReturnValue("Tap to refresh");
  });

  it("returns hasAccounts, handleSync, isError, isRotating, isDisabled, tooltip, icon", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: getDefaultInitialState({ accounts: [mockAccount] }),
    });

    expect(result.current).toMatchObject({
      hasAccounts: true,
      isError: false,
      isRotating: false,
      isDisabled: false,
      tooltip: "Tap to refresh",
    });
    expect(result.current.handleSync).toBeDefined();
    expect(result.current.icon).toBe(Refresh);
  });

  it("handleSync calls onUserRefresh, poll, bridgeSync and track", () => {
    const { result } = renderHook(() => useActivityIndicator(), {
      initialState: getDefaultInitialState({ accounts: [mockAccount] }),
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
