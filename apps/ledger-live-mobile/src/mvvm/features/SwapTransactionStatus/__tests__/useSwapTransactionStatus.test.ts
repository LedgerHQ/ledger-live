import { Linking } from "react-native";
import { log } from "@ledgerhq/logs";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { getTransactionStatus } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { GetTransactionStatusResponse } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";

const mockBridgeSync = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockBridgeSync,
}));
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index", () => ({
  getTransactionStatus: jest.fn(),
}));
jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

const mockedGetTransactionStatus = jest.mocked(getTransactionStatus);
const mockedLog = jest.mocked(log);
const STATUS_POLL_INTERVAL_MS = 60_000;
let setTimeoutSpy: jest.SpiedFunction<typeof global.setTimeout> | undefined;

function makeTransactionStatusResponse(
  overrides: Partial<GetTransactionStatusResponse> = {},
): GetTransactionStatusResponse {
  return {
    provider: "lifi",
    swapId: "swap-1",
    status: "pending",
    ...overrides,
  } as GetTransactionStatusResponse;
}

function captureStatusPollTimeout() {
  const originalSetTimeout = global.setTimeout;
  let runStatusPoll: (() => Promise<void>) | undefined;

  setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(((
    callback: () => unknown,
    delay?: number,
  ) => {
    if (delay === STATUS_POLL_INTERVAL_MS) {
      runStatusPoll = async () => {
        await callback();
      };
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }

    return originalSetTimeout(callback, delay);
  }) as typeof setTimeout);

  return () => runStatusPoll;
}

describe("useSwapTransactionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    setTimeoutSpy?.mockRestore();
    setTimeoutSpy = undefined;
  });

  it("should retry polling after a transient status lookup failure", async () => {
    const getRunStatusPoll = captureStatusPollTimeout();
    mockedGetTransactionStatus
      .mockRejectedValueOnce(new Error("swap history still loading"))
      .mockResolvedValueOnce(makeTransactionStatusResponse());

    const { unmount } = renderHook(() =>
      useSwapTransactionStatus({
        params: { swapId: "swap-1", provider: "lifi" },
        onClose: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(mockedGetTransactionStatus).toHaveBeenCalledTimes(1);
      expect(getRunStatusPoll()).toEqual(expect.any(Function));
    });

    await act(async () => {
      await getRunStatusPoll()?.();
    });

    expect(mockedGetTransactionStatus).toHaveBeenCalledTimes(2);
    unmount();
  });

  it("should stop polling after a terminal status is received", async () => {
    const getRunStatusPoll = captureStatusPollTimeout();
    mockedGetTransactionStatus.mockResolvedValueOnce(
      makeTransactionStatusResponse({ status: "finished" }),
    );

    const { result, unmount } = renderHook(() =>
      useSwapTransactionStatus({
        params: { swapId: "swap-1", provider: "lifi" },
        onClose: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.latestStatus?.status).toBe("finished");
    });

    expect(getRunStatusPoll()).toBeUndefined();
    expect(mockedGetTransactionStatus).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should auto-redirect and close the drawer when a terminal status arrives while hidden", async () => {
    const onClose = jest.fn();
    mockedGetTransactionStatus.mockResolvedValueOnce(
      makeTransactionStatusResponse({ status: "finished" }),
    );

    const { unmount } = renderHook(() =>
      useSwapTransactionStatus({
        params: {
          swapId: "swap-1",
          provider: "lifi",
          redirectUrl: "ledgerlive://swap/done",
        },
        onClose,
      }),
    );

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith("ledgerlive://swap/done");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    unmount();
  });

  it("should log when auto-redirect fails to open", async () => {
    const onClose = jest.fn();
    const error = new Error("Cannot open URL");
    jest.spyOn(Linking, "openURL").mockRejectedValue(error);
    mockedGetTransactionStatus.mockResolvedValueOnce(
      makeTransactionStatusResponse({ status: "finished" }),
    );

    const { unmount } = renderHook(() =>
      useSwapTransactionStatus({
        params: {
          swapId: "swap-1",
          provider: "lifi",
          redirectUrl: "ledgerlive://swap/done",
        },
        onClose,
      }),
    );

    await waitFor(() => {
      expect(mockedLog).toHaveBeenCalledWith(
        "swap-transaction-status",
        "Failed to open auto-redirect URL",
        {
          error,
          url: "ledgerlive://swap/done",
        },
      );
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    unmount();
  });
});
