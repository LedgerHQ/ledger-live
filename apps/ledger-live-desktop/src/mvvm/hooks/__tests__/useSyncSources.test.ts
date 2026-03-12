import { renderHook, act } from "tests/testSetup";
import { useSyncSources } from "../useSyncSources";
import * as countervaluesReact from "@ledgerhq/live-countervalues-react";
import * as bridgeReact from "@ledgerhq/live-common/bridge/react/index";
import * as walletSyncContext from "LLD/features/WalletSync/components/WalletSyncContext";
import { POLLING_FINISHED_DELAY_MS } from "LLD/utils/constants";
import {
  mockPoll,
  mockOnUserRefresh,
  mockBridgeSync,
  defaultPollingReturn,
  defaultWalletSyncReturn,
} from "./fixtures";

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

describe("useSyncSources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue(defaultPollingReturn);
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
    mockUseBridgeSync.mockReturnValue(mockBridgeSync);
    mockUseWalletSyncUserState.mockReturnValue(defaultWalletSyncReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return not pending when all sources are idle", () => {
    const { result } = renderHook(() => useSyncSources());

    expect(result.current.isPending).toBe(false);
    expect(result.current.hasCvOrBridgeError).toBe(false);
    expect(result.current.hasWalletSyncError).toBe(false);
  });

  it("should return isPending true when CV polling is pending", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
    });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.isPending).toBe(true);
  });

  it("should return isPending true when bridge sync is pending", () => {
    mockUseGlobalSyncState.mockReturnValue({ pending: true, error: null });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.isPending).toBe(true);
  });

  it("should return isPending true when wallet sync is pending", () => {
    mockUseWalletSyncUserState.mockReturnValue({
      ...defaultWalletSyncReturn,
      visualPending: true,
    });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.isPending).toBe(true);
  });

  it("should return hasCvOrBridgeError true when CV has error and not pending", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      error: new Error("CV error"),
    });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.hasCvOrBridgeError).toBe(true);
  });

  it("should return hasCvOrBridgeError false when pending even with error", () => {
    jest.spyOn(countervaluesReact, "useCountervaluesPolling").mockReturnValue({
      ...defaultPollingReturn,
      pending: true,
      error: new Error("CV error"),
    });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.hasCvOrBridgeError).toBe(false);
  });

  it("should return hasWalletSyncError true when wallet sync has error", () => {
    mockUseWalletSyncUserState.mockReturnValue({
      ...defaultWalletSyncReturn,
      walletSyncError: new Error("WS error"),
    });

    const { result } = renderHook(() => useSyncSources());

    expect(result.current.hasWalletSyncError).toBe(true);
  });

  it("should call all three sync sources on triggerRefresh", () => {
    const { result } = renderHook(() => useSyncSources());

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

  it("should stabilize pending via useStablePending", () => {
    jest.useFakeTimers();

    const pollingMock = jest
      .spyOn(countervaluesReact, "useCountervaluesPolling")
      .mockReturnValue({ ...defaultPollingReturn, pending: true });

    const { result, rerender } = renderHook(() => useSyncSources());

    expect(result.current.stablePending).toBe(true);

    pollingMock.mockReturnValue({ ...defaultPollingReturn, pending: false });
    rerender();

    expect(result.current.stablePending).toBe(true);

    act(() => {
      jest.advanceTimersByTime(POLLING_FINISHED_DELAY_MS);
    });

    expect(result.current.stablePending).toBe(false);

    jest.useRealTimers();
  });
});
