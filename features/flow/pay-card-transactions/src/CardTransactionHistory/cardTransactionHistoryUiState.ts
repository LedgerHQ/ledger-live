import { resolveCardTransactionsDisplayState } from "../logic/cardTransactionsDisplayState";
import type { CardHistoryDayGroup } from "./groupCardHistoryItems";

export type CardTransactionHistoryUiState =
  | { kind: "signedOut" }
  | { kind: "unclaimed" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "ready"; groups: readonly CardHistoryDayGroup[] };

export function resolveCardTransactionHistoryUiState({
  isSignedIn,
  isCardMissing,
  isCardStatusLoading,
  isLoading,
  isError,
  groups,
}: {
  isSignedIn: boolean;
  isCardMissing: boolean;
  isCardStatusLoading: boolean;
  isLoading: boolean;
  isError: boolean;
  groups: readonly CardHistoryDayGroup[];
}): CardTransactionHistoryUiState {
  if (!isSignedIn) {
    return { kind: "signedOut" };
  }

  if (isCardMissing) {
    return { kind: "unclaimed" };
  }

  if (isCardStatusLoading && isError) {
    return { kind: "loading" };
  }

  const displayState = resolveCardTransactionsDisplayState({
    isLoading,
    isError,
    hasTransactions: groups.length > 0,
  });

  if (displayState === "ready") {
    return { kind: "ready", groups };
  }

  return { kind: displayState };
}
