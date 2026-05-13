import type { AccountLike } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import type { SwapStatus } from "../../swap/types";

export type SwapTransactionStatusPhase = "polling_hidden" | "polling_visible" | "settled_visible";

const TERMINAL_SWAP_STATUSES: ReadonlySet<SwapStatus["status"]> = new Set([
  TransactionStatus.Finished,
  TransactionStatus.Refunded,
  TransactionStatus.Expired,
]);

export function isTerminalSwapStatus(status: SwapStatus["status"]): boolean {
  return TERMINAL_SWAP_STATUSES.has(status);
}

export function shouldPollSwapTransactionStatus(status: SwapStatus["status"] | undefined): boolean {
  return status === TransactionStatus.Pending;
}

type SendSwapStatusValue =
  | typeof TransactionStatus.Pending
  | typeof TransactionStatus.Finished
  | typeof TransactionStatus.Refunded;

export type SendSwapStatus = Extract<SwapStatus["status"], SendSwapStatusValue>;

export type SwapTransactionLegStatuses = {
  sendStatus?: SwapStatus["status"];
  receiveStatus?: SwapStatus["status"];
};

export function getSendSwapStatus(
  accounts: AccountLike[],
  operationHash: string | undefined,
): SendSwapStatus | undefined {
  if (!operationHash) return undefined;

  for (const account of accounts) {
    const operation = [...(account.operations ?? []), ...(account.pendingOperations ?? [])].find(
      operation => operation.hash === operationHash,
    );
    if (operation) {
      if (operation.blockHeight != null) {
        return operation.hasFailed ? TransactionStatus.Refunded : TransactionStatus.Finished;
      }
      return TransactionStatus.Pending;
    }
  }

  return undefined;
}

export function getSwapTransactionLegStatuses({
  providerStatus,
  sendStatus,
}: {
  providerStatus: SwapStatus["status"] | undefined;
  sendStatus: SendSwapStatus | undefined;
}): SwapTransactionLegStatuses {
  if (sendStatus === TransactionStatus.Refunded) {
    return {
      sendStatus,
      receiveStatus: TransactionStatus.Refunded,
    };
  }

  return {
    sendStatus: sendStatus ?? providerStatus,
    receiveStatus: providerStatus,
  };
}

export function getSwapTransactionLegStatusesFromAccounts({
  accounts,
  operationHash,
  providerStatus,
}: {
  accounts: AccountLike[];
  operationHash: string | undefined;
  providerStatus: SwapStatus["status"] | undefined;
}): SwapTransactionLegStatuses {
  return getSwapTransactionLegStatuses({
    providerStatus,
    sendStatus: getSendSwapStatus(accounts, operationHash),
  });
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
      return assertNever(event);
    }
  }
}

function assertNever(event: never): never {
  throw new Error(`Unsupported swap transaction status event: ${JSON.stringify(event)}`);
}
