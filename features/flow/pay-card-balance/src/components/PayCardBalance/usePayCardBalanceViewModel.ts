import type { PayCardBalanceProps, PayCardBalanceViewProps } from "./types";

export function usePayCardBalanceViewModel({
  status,
  stableBalance,
  filter,
  formatCountervalue,
  labels,
}: PayCardBalanceProps): PayCardBalanceViewProps {
  const isLoading = status === "loading";
  const isFunded = isLoading || (status === "ready" && stableBalance > 0);

  if (!isFunded) {
    return { displayMode: "empty", labels };
  }

  return {
    displayMode: "funded",
    balance: stableBalance,
    formatCountervalue,
    filter,
    isLoading,
  };
}
