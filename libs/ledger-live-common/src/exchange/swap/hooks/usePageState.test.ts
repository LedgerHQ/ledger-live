/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { usePageState } from "./usePageState";
import { SwapTransactionType } from "../types";

describe("usePageState", () => {
  it("returns the correct page state", () => {
    const swapTransaction = {
      swap: {
        from: {
          amount: {
            isZero: () => true,
          },
        },
        rates: {
          status: "success",
        },
        isMaxLoading: false,
      },
    } as SwapTransactionType;

    let swapError: { message: string } | undefined = undefined;

    const { result, rerender } = renderHook(() => usePageState(swapTransaction, swapError));

    // Initial render
    expect(result.current).toBe("initial");

    // Rerender with rates loading
    swapTransaction.swap.rates.status = "loading";
    rerender();
    expect(result.current).toBe("loading");

    // Rerender with rates error
    swapTransaction.swap.rates.status = "error";
    rerender();
    expect(result.current).toBe("initial");

    // Rerender with empty error message and data loaded
    swapTransaction.swap.rates.status = "success";
    swapError = { message: "" };
    rerender();
    expect(result.current).toBe("empty");

    // Rerender with from field is zero and data loaded
    swapError = undefined;
    if (swapTransaction.swap.from.amount) swapTransaction.swap.from.amount.isZero = () => true;
    rerender();
    expect(result.current).toBe("initial");
  });
});
