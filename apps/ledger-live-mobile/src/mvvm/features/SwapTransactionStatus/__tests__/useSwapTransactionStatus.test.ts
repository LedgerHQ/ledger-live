import { Linking } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { getTransactionStatus } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { GetTransactionStatusResponse } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useSwapTransactionStatus } from "../hooks/useSwapTransactionStatus";

const mockBridgeSync = jest.fn();

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockBridgeSync,
}));
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index"),
  getTransactionStatus: jest.fn(),
}));

const mockedUseSelector = jest.mocked(useSelector);
const mockedGetTransactionStatus = jest.mocked(getTransactionStatus);
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
    mockedUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return [];
      return undefined;
    });
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
});
