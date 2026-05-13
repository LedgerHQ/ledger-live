import type { SwapStatus } from "../swap/types";

export type SwapTransactionStatusPhase = "polling_hidden" | "polling_visible" | "settled_visible";

const TERMINAL_SWAP_STATUSES: ReadonlySet<SwapStatus["status"]> = new Set([
  "finished",
  "refunded",
  "expired",
]);

export function isTerminalSwapStatus(status: SwapStatus["status"]): boolean {
  return TERMINAL_SWAP_STATUSES.has(status);
}

export function shouldPollSwapTransactionStatus(status: SwapStatus["status"] | undefined): boolean {
  return status === "pending";
}

export type SwapTransactionStatusControllerState = {
  phase: SwapTransactionStatusPhase;
  latestStatus?: SwapStatus;
  shouldAutoRedirect: boolean;
};

export type SwapTransactionStatusControllerEvent =
  | { type: "POLL_SUCCEEDED"; status: SwapStatus }
  | { type: "SOFT_DEADLINE_REACHED" };

export function createInitialSwapTransactionStatusState(
  initialStatus?: SwapStatus,
): SwapTransactionStatusControllerState {
  if (!initialStatus) {
    return {
      phase: "polling_hidden",
      shouldAutoRedirect: false,
    };
  }

  return {
    phase: isTerminalSwapStatus(initialStatus.status) ? "settled_visible" : "polling_visible",
    latestStatus: initialStatus,
    shouldAutoRedirect: false,
  };
}

export const INITIAL_SWAP_TRANSACTION_STATUS_STATE = createInitialSwapTransactionStatusState();

export function swapTransactionStatusReducer(
  state: SwapTransactionStatusControllerState,
  event: SwapTransactionStatusControllerEvent,
): SwapTransactionStatusControllerState {
  switch (event.type) {
    case "POLL_SUCCEEDED": {
      const isTerminal = isTerminalSwapStatus(event.status.status);

      if (state.phase === "polling_hidden") {
        if (isTerminal) {
          return {
            ...state,
            latestStatus: event.status,
            shouldAutoRedirect: true,
          };
        }
        return { ...state, latestStatus: event.status };
      }

      if (state.phase === "polling_visible" && isTerminal) {
        return {
          phase: "settled_visible",
          latestStatus: event.status,
          shouldAutoRedirect: false,
        };
      }

      return { ...state, latestStatus: event.status };
    }

    case "SOFT_DEADLINE_REACHED": {
      if (state.phase !== "polling_hidden") return state;
      if (state.latestStatus && isTerminalSwapStatus(state.latestStatus.status)) {
        return {
          ...state,
          phase: "settled_visible",
          shouldAutoRedirect: false,
        };
      }
      return { ...state, phase: "polling_visible", shouldAutoRedirect: false };
    }

    default: {
      assertNever(event);
      return state;
    }
  }
}

function assertNever(_event: never): void {}
