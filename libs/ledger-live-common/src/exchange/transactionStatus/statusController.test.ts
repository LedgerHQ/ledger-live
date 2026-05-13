import type { SwapStatus } from "../swap/types";
import {
  createInitialSwapTransactionStatusState,
  isTerminalSwapStatus,
  shouldPollSwapTransactionStatus,
  swapTransactionStatusReducer,
} from "./statusController";

const pending: SwapStatus = { provider: "lifi", swapId: "swap-1", status: "pending" };
const finished: SwapStatus = { provider: "lifi", swapId: "swap-1", status: "finished" };
const refunded: SwapStatus = { provider: "lifi", swapId: "swap-1", status: "refunded" };
const unknown: SwapStatus = { provider: "uniswap", swapId: "swap-1", status: "unknown" };

describe("isTerminalSwapStatus", () => {
  it("classifies terminal swap statuses", () => {
    expect(isTerminalSwapStatus("finished")).toBe(true);
    expect(isTerminalSwapStatus("refunded")).toBe(true);
    expect(isTerminalSwapStatus("expired")).toBe(true);
    expect(isTerminalSwapStatus("pending")).toBe(false);
    expect(isTerminalSwapStatus("onhold")).toBe(false);
    expect(isTerminalSwapStatus("unknown")).toBe(false);
  });
});

describe("shouldPollSwapTransactionStatus", () => {
  it("polls only for pending status", () => {
    expect(shouldPollSwapTransactionStatus(undefined)).toBe(false);
    expect(shouldPollSwapTransactionStatus("pending")).toBe(true);
    expect(shouldPollSwapTransactionStatus("onhold")).toBe(false);
    expect(shouldPollSwapTransactionStatus("unknown")).toBe(false);
    expect(shouldPollSwapTransactionStatus("finished")).toBe(false);
    expect(shouldPollSwapTransactionStatus("refunded")).toBe(false);
    expect(shouldPollSwapTransactionStatus("expired")).toBe(false);
  });
});

describe("createInitialSwapTransactionStatusState", () => {
  it("starts hidden for cold deeplinks without known status", () => {
    expect(createInitialSwapTransactionStatusState()).toEqual({
      phase: "polling_hidden",
      shouldAutoRedirect: false,
    });
  });

  it("starts visible for known pending history entries", () => {
    expect(createInitialSwapTransactionStatusState(pending)).toEqual({
      phase: "polling_visible",
      latestStatus: pending,
      shouldAutoRedirect: false,
    });
  });

  it("starts settled for known terminal history entries", () => {
    expect(createInitialSwapTransactionStatusState(refunded)).toEqual({
      phase: "settled_visible",
      latestStatus: refunded,
      shouldAutoRedirect: false,
    });
  });
});

describe("swapTransactionStatusReducer", () => {
  it("auto-redirects when terminal status arrives while hidden", () => {
    const state = swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
      type: "POLL_SUCCEEDED",
      status: finished,
    });

    expect(state).toEqual({
      phase: "polling_hidden",
      latestStatus: finished,
      shouldAutoRedirect: true,
    });
  });

  it("reveals pending UI after the soft deadline", () => {
    expect(
      swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
        type: "SOFT_DEADLINE_REACHED",
      }),
    ).toEqual({
      phase: "polling_visible",
      shouldAutoRedirect: false,
    });
  });

  it("reveals settled UI after the soft deadline if a terminal status already arrived", () => {
    const hiddenTerminal = swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
      type: "POLL_SUCCEEDED",
      status: finished,
    });

    expect(
      swapTransactionStatusReducer(hiddenTerminal, {
        type: "SOFT_DEADLINE_REACHED",
      }),
    ).toEqual({
      phase: "settled_visible",
      latestStatus: finished,
      shouldAutoRedirect: false,
    });
  });

  it("settles visible pending UI when a terminal poll arrives", () => {
    const visible = swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
      type: "SOFT_DEADLINE_REACHED",
    });

    expect(
      swapTransactionStatusReducer(visible, {
        type: "POLL_SUCCEEDED",
        status: finished,
      }),
    ).toEqual({
      phase: "settled_visible",
      latestStatus: finished,
      shouldAutoRedirect: false,
    });
  });

  it("keeps visible UI pending for non-terminal polls", () => {
    const visible = swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
      type: "SOFT_DEADLINE_REACHED",
    });

    expect(
      swapTransactionStatusReducer(visible, {
        type: "POLL_SUCCEEDED",
        status: pending,
      }),
    ).toEqual({
      phase: "polling_visible",
      latestStatus: pending,
      shouldAutoRedirect: false,
    });
  });

  it("keeps visible UI pending for unknown status", () => {
    const visible = swapTransactionStatusReducer(createInitialSwapTransactionStatusState(), {
      type: "SOFT_DEADLINE_REACHED",
    });

    expect(
      swapTransactionStatusReducer(visible, {
        type: "POLL_SUCCEEDED",
        status: unknown,
      }),
    ).toEqual({
      phase: "polling_visible",
      latestStatus: unknown,
      shouldAutoRedirect: false,
    });
  });
});
