import { useEffect, useState } from "react";
import { RatesReducerState, SwapTransactionType } from "../types";

type PageState = "initial" | "empty" | "loading" | "loaded";

type SwapError =
  | SwapTransactionType["fromAmountError"]
  | RatesReducerState["error"]
  | { message: string };

// when the user first lands on this screen, they are seeing the initial state
// when the user fetches data, they are seeing the loading state
// when the data is returned, they are seeing the loaded state
// when the user updates their search, they still see the loaded state
// when the user fetches data and there is an error, they see the empty state
// when the user fetches data and there is no data, they see the empty state
// when the user resets their from search, they see the initial state
export const usePageState = (
  swapTransaction: SwapTransactionType,
  swapError: SwapError | undefined,
): PageState => {
  const [pageState, setPageState] = useState<PageState>("initial");
  const fromFieldIsZero = swapTransaction.swap.from.amount?.isZero() ?? true;
  const isDataLoading =
    swapTransaction.swap.isMaxLoading || swapTransaction.swap.rates.status === "loading";

  useEffect(() => {
    let state: PageState | undefined;
    if (!fromFieldIsZero && swapTransaction.swap.rates.status === "success") {
      state = "loaded";
    } else if (
      pageState === "loading" &&
      !isDataLoading &&
      swapTransaction.swap.rates.status === "error"
    ) {
      state = "initial";
    } else if ((pageState === "initial" || pageState === "empty") && isDataLoading) {
      state = "loading";
    } else if (swapError && swapError?.message.length === 0 && !isDataLoading) {
      state = "empty";
    } else if (fromFieldIsZero && !isDataLoading) {
      state = "initial";
    }
    state && pageState !== state && setPageState(state);
  }, [
    pageState,
    isDataLoading,
    swapTransaction.swap.rates.status,
    swapTransaction.swap.from.amount,
    swapTransaction.swap.isMaxLoading,
    fromFieldIsZero,
    swapError,
  ]);

  return pageState;
};
