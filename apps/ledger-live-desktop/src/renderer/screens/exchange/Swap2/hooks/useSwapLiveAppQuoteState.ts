import BigNumber from "bignumber.js";
import { useCallback, useState } from "react";

export type CustomSwapQuotesState = {
  amountTo: BigNumber | undefined;
  swapError: Error | undefined;
  counterValue: BigNumber | undefined;
};

export function useSwapLiveAppQuoteState({
  amountTo,
  swapError,
  counterValue,
}: CustomSwapQuotesState): [CustomSwapQuotesState, (next: CustomSwapQuotesState) => void] {
  const [state, setQuoteState] = useState({
    amountTo,
    swapError,
    counterValue,
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
