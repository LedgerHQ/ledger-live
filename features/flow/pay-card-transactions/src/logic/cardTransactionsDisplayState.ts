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
  // Only a read that returned nothing is fatal. Once anything has been read, a failure leaves the
  // list standing rather than blanking it — that covers a later page, and equally a refresh that
  // failed over cached pages. The cost is that such a failure is not announced anywhere.
  if (!hasTransactions) return isError ? "error" : "empty";
  return "ready";
}
