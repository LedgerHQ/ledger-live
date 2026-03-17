/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook, act } from "@testing-library/react";
import {
  useSyncSources,
  POLLING_FINISHED_DELAY_MS,
  type WalletSyncUserState,
} from "../useSyncSources";
import * as countervaluesReact from "@ledgerhq/live-countervalues-react";
import * as context from "../context";
import * as globalSyncStateModule from "../useGlobalSyncState";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesPolling: jest.fn(),
}));

jest.mock("../context", () => ({
  useBridgeSync: jest.fn(),
}));

jest.mock("../useGlobalSyncState", () => ({
  useGlobalSyncState: jest.fn(),
}));

const mockPoll = jest.fn();
const mockOnUserRefresh = jest.fn();
const mockBridgeSync = jest.fn();

const defaultPollingReturn = {
  poll: mockPoll,
  pending: false,
  error: null,
  wipe: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const defaultWalletSync: WalletSyncUserState = {
  onUserRefresh: mockOnUserRefresh,
  visualPending: false,
  walletSyncError: null,
};

const mockUseCountervaluesPolling = jest.mocked(countervaluesReact.useCountervaluesPolling);
const mockUseBridgeSync = jest.mocked(context.useBridgeSync);
const mockUseGlobalSyncState = jest.mocked(globalSyncStateModule.useGlobalSyncState);

function renderSyncSources(walletSync: WalletSyncUserState = defaultWalletSync) {
  return renderHook((ws: WalletSyncUserState) => useSyncSources(ws), {
    initialProps: walletSync,
  });
}

describe("useSyncSources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCountervaluesPolling.mockReturnValue(defaultPollingReturn);
    mockUseGlobalSyncState.mockReturnValue({ pending: false, error: null });
    mockUseBridgeSync.mockReturnValue(mockBridgeSync);
  });

  it("should return not pending and no errors when all sources are idle", () => {
    const { result } = renderSyncSources();

    expect(result.current.isPending).toBe(false);
    expect(result.current.hasCvOrBridgeError).toBe(false);
    expect(result.current.hasWalletSyncError).toBe(false);
  });

  it.each([
    {
      label: "CV polling",
      setup: () =>
        mockUseCountervaluesPolling.mockReturnValue({ ...defaultPollingReturn, pending: true }),
    },
    {
      label: "bridge sync",
      setup: () => mockUseGlobalSyncState.mockReturnValue({ pending: true, error: null }),
    },
  ])("should return isPending true when $label is pending", ({ setup }) => {
    setup();
    const { result } = renderSyncSources();
    expect(result.current.isPending).toBe(true);
  });

  it("should return isPending true when wallet sync is pending", () => {
    const { result } = renderSyncSources({ ...defaultWalletSync, visualPending: true });
    expect(result.current.isPending).toBe(true);
  });

  describe("hasCvOrBridgeError", () => {
    it.each([
      {
        label: "CV",
        setup: () =>
          mockUseCountervaluesPolling.mockReturnValue({
            ...defaultPollingReturn,
            error: new Error("CV error"),
          }),
      },
      {
        label: "bridge",
        setup: () =>
          mockUseGlobalSyncState.mockReturnValue({
            pending: false,
            error: new Error("bridge error"),
          }),
      },
    ])("should be true when $label has error and not pending", ({ setup }) => {
      setup();
      const { result } = renderSyncSources();
      expect(result.current.hasCvOrBridgeError).toBe(true);
    });

    it("should be false when pending even with CV error (error masked during polling)", () => {
      mockUseCountervaluesPolling.mockReturnValue({
        ...defaultPollingReturn,
        pending: true,
        error: new Error("CV error"),
      });

      const { result } = renderSyncSources();
      expect(result.current.hasCvOrBridgeError).toBe(false);
    });
  });

  it("should return hasWalletSyncError true when wallet sync has error", () => {
    const { result } = renderSyncSources({
      ...defaultWalletSync,
      walletSyncError: new Error("WS error"),
    });

    expect(result.current.hasWalletSyncError).toBe(true);
  });

  it("should call all three sync sources on triggerRefresh", () => {
    const { result } = renderSyncSources();

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

  it("should stabilize pending via useStablePending (stays true briefly after pending drops)", () => {
    jest.useFakeTimers();

    mockUseCountervaluesPolling.mockReturnValue({ ...defaultPollingReturn, pending: true });

    const { result, rerender } = renderSyncSources();
    expect(result.current.stablePending).toBe(true);

    mockUseCountervaluesPolling.mockReturnValue({ ...defaultPollingReturn, pending: false });
    rerender(defaultWalletSync);
    expect(result.current.stablePending).toBe(true);

    act(() => {
      jest.advanceTimersByTime(POLLING_FINISHED_DELAY_MS);
    });
    expect(result.current.stablePending).toBe(false);

    jest.useRealTimers();
  });
});
