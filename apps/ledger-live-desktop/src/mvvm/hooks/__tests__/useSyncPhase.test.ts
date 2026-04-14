import { act, renderHook } from "tests/testSetup";
import { useSyncPhase } from "../useSyncPhase";
import { SYNC_SETTLE_GUARD_MS } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { mockPoll, mockOnUserRefresh, mockBridgeSync } from "./fixtures";
import {
  setLastUserSyncClickTimestamp,
  setHasCompletedInitialSync,
} from "~/renderer/reducers/syncRefresh";

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

describe("useSyncPhase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSyncSources.mockReturnValue({
      isPending: false,
      stablePending: false,
      hasCvOrBridgeError: false,
      hasWalletSyncError: false,
      triggerRefresh: mockTriggerRefresh,
    });
  });

  it("should return synced when not syncing and no errors", () => {
    const { result } = renderHook(() => useSyncPhase(), {
      initialState: defaultInitialState,
    });

    expect(result.current).toBe("synced");
  });

  it("should return syncing during initial loading", () => {
    mockUseSyncSources.mockReturnValue(syncingState);

    const { result } = renderHook(() => useSyncPhase(), {
      initialState: {
        ...defaultInitialState,
        accounts: [BTC_ACCOUNT],
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
      },
    });

    expect(result.current).toBe("syncing");
  });

  it("should return synced after initial sync completes", () => {
    jest.useFakeTimers();
    mockUseSyncSources.mockReturnValue(syncingState);

    const { result, rerender, store } = renderHook(() => useSyncPhase(), {
      initialState: {
        ...defaultInitialState,
        accounts: [BTC_ACCOUNT],
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: false },
      },
    });

    expect(result.current).toBe("syncing");

    mockUseSyncSources.mockReturnValue({
      isPending: false,
      stablePending: false,
      hasCvOrBridgeError: false,
      hasWalletSyncError: false,
      triggerRefresh: mockTriggerRefresh,
    });

    // In the real app, usePortfolioBalance dispatches setHasCompletedInitialSync(true)
    // when stablePending transitions to false. Simulate that here.
    act(() => {
      store.dispatch(setHasCompletedInitialSync(true));
      rerender();
    });
    act(() => {
      jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS);
    });

    expect(result.current).toBe("synced");

    jest.useRealTimers();
  });

  it("should return syncing during manual refresh", () => {
    mockUseSyncSources.mockReturnValue(syncingState);

    const { result, store } = renderHook(() => useSyncPhase(), {
      initialState: {
        ...defaultInitialState,
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: true },
      },
    });

    expect(result.current).toBe("synced");

    act(() => {
      store.dispatch(setLastUserSyncClickTimestamp(Date.now()));
    });

    expect(result.current).toBe("syncing");
  });

  it("should not show syncing during auto-refresh (no recent user click)", () => {
    mockUseSyncSources.mockReturnValue(syncingState);

    const { result } = renderHook(() => useSyncPhase(), {
      initialState: {
        ...defaultInitialState,
        syncRefresh: { lastUserSyncClickTimestamp: 0, hasCompletedInitialSync: true },
      },
    });

    expect(result.current).toBe("synced");
  });

  it("should return failed when there is a sync error", () => {
    mockUseSyncSources.mockReturnValue({
      isPending: false,
      stablePending: false,
      hasCvOrBridgeError: true,
      hasWalletSyncError: false,
      triggerRefresh: mockTriggerRefresh,
    });

    const { result } = renderHook(() => useSyncPhase(), {
      initialState: defaultInitialState,
    });

    expect(result.current).toBe("failed");
  });
});
