/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getTransactionStatus } from "../../../wallet-api/Exchange/transactionStatus/index";
import type { GetTransactionStatusResponse } from "../../../wallet-api/Exchange/transactionStatus/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSwapTransactionStatusController } from "./useSwapTransactionStatusController";

const mockBridgeSync = jest.fn();

jest.mock("../../../bridge/react/index", () => ({
  useBridgeSync: () => mockBridgeSync,
}));

jest.mock("../../../wallet-api/Exchange/transactionStatus/index", () => ({
  getTransactionStatus: jest.fn(),
}));

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

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function renderController({
  accounts = [],
  onAutoRedirect,
}: {
  accounts?: AccountLike[];
  onAutoRedirect?: (redirectUrl: string) => void;
} = {}) {
  return renderHook(() =>
    useSwapTransactionStatusController({
      params: { swapId: "swap-1", provider: "lifi" },
      accounts,
      onAutoRedirect,
    }),
  );
}

describe("useSwapTransactionStatusController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    setTimeoutSpy?.mockRestore();
    setTimeoutSpy = undefined;
  });

  it("should retry polling after a transient status lookup failure", async () => {
    const getRunStatusPoll = captureStatusPollTimeout();
    mockedGetTransactionStatus
      .mockRejectedValueOnce(new Error("swap history still loading"))
      .mockResolvedValueOnce(makeTransactionStatusResponse());

    const { unmount } = renderController();

    await flushAsyncEffects();

    expect(mockedGetTransactionStatus).toHaveBeenCalledTimes(1);
    expect(getRunStatusPoll()).toEqual(expect.any(Function));

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

    const { result, unmount } = renderController();

    await flushAsyncEffects();

    expect(result.current.latestStatus?.status).toBe("finished");
    expect(getRunStatusPoll()).toBeUndefined();
    expect(mockedGetTransactionStatus).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("should call the app redirect handler when a terminal status arrives while hidden", async () => {
    const onAutoRedirect = jest.fn();
    mockedGetTransactionStatus.mockResolvedValueOnce(
      makeTransactionStatusResponse({ status: "finished" }),
    );

    const { unmount } = renderHook(() =>
      useSwapTransactionStatusController({
        params: {
          swapId: "swap-1",
          provider: "lifi",
          redirectUrl: "ledgerlive://swap/done",
        },
        accounts: [],
        onAutoRedirect,
      }),
    );

    await waitFor(() => {
      expect(onAutoRedirect).toHaveBeenCalledWith("ledgerlive://swap/done");
    });
    unmount();
  });

  it("should update leg statuses from confirmed local account operations", async () => {
    const account = genAccount("swap-status-account", { operationsSize: 1 });
    account.operations[0] = {
      ...account.operations[0],
      hash: "0xabc",
      blockHeight: 123,
      hasFailed: false,
    };
    mockedGetTransactionStatus.mockResolvedValueOnce(
      makeTransactionStatusResponse({
        operationHash: "0xabc",
        fromAccountId: account.id,
        status: "unknown",
      }),
    );

    const { result, unmount } = renderController({ accounts: [account] });

    await waitFor(() => {
      expect(result.current.details?.sendStatus).toBe("finished");
      expect(result.current.details?.receiveStatus).toBe("unknown");
    });
    unmount();
  });
});
