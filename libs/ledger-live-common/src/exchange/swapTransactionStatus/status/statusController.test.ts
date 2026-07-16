import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SwapStatus } from "../../swap/types";
import {
  createInitialSwapTransactionStatusState,
  getSendSwapStatus,
  getSwapTransactionLegStatuses,
  getSwapTransactionLegStatusesFromAccounts,
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

describe("getSendSwapStatus", () => {
  const makeAccounts = ({
    blockHeight,
    hasFailed,
  }: {
    blockHeight?: number | null;
    hasFailed?: boolean;
  }) => {
    const account = genAccount("swap-status-account", { operationsSize: 1 });
    account.operations[0] = {
      ...account.operations[0],
      hash: "0xabc",
      blockHeight,
      hasFailed,
    };
    return [account];
  };

  it("returns finished for a confirmed successful operation", () => {
    expect(getSendSwapStatus(makeAccounts({ blockHeight: 123, hasFailed: false }), "0xabc")).toBe(
      "finished",
    );
  });

  it("returns refunded for a confirmed failed operation", () => {
    expect(getSendSwapStatus(makeAccounts({ blockHeight: 123, hasFailed: true }), "0xabc")).toBe(
      "refunded",
    );
  });

  it("returns pending while the operation is unconfirmed", () => {
    expect(getSendSwapStatus(makeAccounts({ blockHeight: null, hasFailed: true }), "0xabc")).toBe(
      "pending",
    );
  });

  it("does not return a status without a matching operation hash", () => {
    expect(getSendSwapStatus(makeAccounts({ blockHeight: 123 }), "0xdef")).toBe(undefined);
    expect(getSendSwapStatus(makeAccounts({ blockHeight: 123 }), undefined)).toBe(undefined);
  });

  it("derives leg statuses from local send status and provider status", () => {
    expect(
      getSwapTransactionLegStatuses({ sendStatus: "finished", providerStatus: "unknown" }),
    ).toEqual({
      sendStatus: "finished",
      receiveStatus: "unknown",
    });

    expect(
      getSwapTransactionLegStatuses({ sendStatus: "refunded", providerStatus: "unknown" }),
    ).toEqual({
      sendStatus: "refunded",
      receiveStatus: "refunded",
    });

    expect(
      getSwapTransactionLegStatuses({ sendStatus: undefined, providerStatus: "pending" }),
    ).toEqual({
      sendStatus: "pending",
      receiveStatus: "pending",
    });
  });

  it("derives leg statuses from accounts", () => {
    expect(
      getSwapTransactionLegStatusesFromAccounts({
        accounts: makeAccounts({ blockHeight: 123, hasFailed: false }),
        operationHash: "0xabc",
        providerStatus: "unknown",
      }),
    ).toEqual({
      sendStatus: "finished",
      receiveStatus: "unknown",
    });
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
