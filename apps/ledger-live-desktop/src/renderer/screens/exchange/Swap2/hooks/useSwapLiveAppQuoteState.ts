import BigNumber from "bignumber.js";
import { useCallback, useState } from "react";

export type CustomSwapQuotesState = {
  amountTo: BigNumber | undefined;
  swapError: Error | undefined;
};

export function useSwapLiveAppQuoteState({
  amountTo,
  swapError,
}: CustomSwapQuotesState): [CustomSwapQuotesState, (next: CustomSwapQuotesState) => void] {
  const [state, setQuoteState] = useState({
    amountTo,
    swapError,
  });

  const updateQuoteState = useCallback(
    (next: CustomSwapQuotesState) => {
      setQuoteState({
        ...next, // Apply updates provided to function
        swapError: swapError || next.swapError,
      });
    },
    [swapError],
  );
  return [state, updateQuoteState];
}
