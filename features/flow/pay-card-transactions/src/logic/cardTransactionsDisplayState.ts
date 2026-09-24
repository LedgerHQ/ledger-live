export type CardTransactionsDisplayState = "loading" | "error" | "empty" | "ready";

export function resolveCardTransactionsDisplayState({
  isLoading,
  isError,
  hasTransactions,
}: {
  isLoading: boolean;
  isError: boolean;
  hasTransactions: boolean;
}): CardTransactionsDisplayState {
  if (isLoading) return "loading";
  if (isError) return "error";
  if (!hasTransactions) return "empty";
  return "ready";
}
