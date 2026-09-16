import { resolveCardTransactionsDisplayState } from "../logic/cardTransactionsDisplayState";
import type { CardHistoryDayGroup } from "./groupCardHistoryItems";

export type CardTransactionHistoryUiState =
  | { kind: "signedOut" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "ready"; groups: readonly CardHistoryDayGroup[] };

export function resolveCardTransactionHistoryUiState({
  isSignedIn,
  isLoading,
  isError,
  groups,
}: {
  isSignedIn: boolean;
  isLoading: boolean;
  isError: boolean;
  groups: readonly CardHistoryDayGroup[];
}): CardTransactionHistoryUiState {
  if (!isSignedIn) {
    return { kind: "signedOut" };
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
