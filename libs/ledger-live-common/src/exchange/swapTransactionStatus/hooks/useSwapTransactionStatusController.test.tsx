/**
 * @jest-environment node
 */
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getTransactionStatus } from "../../../wallet-api/Exchange/transactionStatus/index";
import type { GetTransactionStatusResponse } from "../../../wallet-api/Exchange/transactionStatus/index";
import type { AccountLike } from "@ledgerhq/types-live";
import type ReactType from "react";
import type { ReactTestRenderer } from "react-test-renderer";
import { useSwapTransactionStatusController } from "./useSwapTransactionStatusController";

// React 19 requires this flag for explicit act() calls outside Testing Library.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const originalMessageChannelDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "MessageChannel",
);

class TestMessageChannel {
  port1 = {
    onmessage: undefined as ((event: MessageEvent) => void) | undefined,
    start: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  port2 = {
    postMessage: () => {
      setTimeout(() => {
        this.port1.onmessage?.({ data: undefined } as MessageEvent);
      }, 0);
    },
    start: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
}

Object.defineProperty(globalThis, "MessageChannel", {
  configurable: true,
  value: TestMessageChannel,
});

const React = require("react") as typeof ReactType;
const { act, create } = require("react-test-renderer") as typeof import("react-test-renderer");

const mockBridgeSync = jest.fn();
let consoleErrorSpy: jest.SpiedFunction<typeof console.error> | undefined;

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

async function waitForExpectation(assertion: () => void) {
  const startedAt = Date.now();
  let latestError: unknown;

  while (Date.now() - startedAt < 1_000) {
    try {
      assertion();
      return;
    } catch (error) {
      latestError = error;
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
    }
  }

  throw latestError;
}

function renderHookResult<T>(useHook: () => T) {
  const result: { current?: T } = {};
  let renderer: ReactTestRenderer | undefined;

  function TestComponent() {
    result.current = useHook();
    return React.createElement(React.Fragment);
  }

  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  return {
    result: result as { current: T },
    unmount: () => {
      act(() => {
        renderer?.unmount();
      });
    },
  };
}

function renderController({
  accounts = [],
  onAutoRedirect,
}: {
  accounts?: AccountLike[];
  onAutoRedirect?: (redirectUrl: string) => void;
} = {}) {
  return renderHookResult(() =>
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
    const originalConsoleError = console.error;
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message, ...args) => {
      if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
        return;
      }
      originalConsoleError(message, ...args);
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = undefined;
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

    const { unmount } = renderHookResult(() =>
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

    await waitForExpectation(() => {
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

    await waitForExpectation(() => {
      expect(result.current.details?.sendStatus).toBe("finished");
      expect(result.current.details?.receiveStatus).toBe("unknown");
    });
    unmount();
  });
});

afterAll(() => {
  if (originalMessageChannelDescriptor) {
    Object.defineProperty(globalThis, "MessageChannel", originalMessageChannelDescriptor);
  }
});
