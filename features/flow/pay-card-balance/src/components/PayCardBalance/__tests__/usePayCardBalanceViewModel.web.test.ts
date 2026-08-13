import { act, renderHook } from "@testing-library/react";
import { usePayCardBalanceViewModel } from "../usePayCardBalanceViewModel";
import type { PayCardBalanceProps } from "../types";
import { USDC_ID, formatCountervalue, labels, options } from "./fixtures";

function buildProps(overrides: Partial<PayCardBalanceProps> = {}): PayCardBalanceProps {
  return {
    status: "ready",
    stableBalance: 0,
    filter: "all",
    hasBalance: false,
    filterOptions: options,
    formatCountervalue,
    onConfirmFilter: jest.fn(),
    labels,
    ...overrides,
  };
}

describe("usePayCardBalanceViewModel", () => {
  it("should be empty when the user has no balance", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ hasBalance: false })),
    );

    expect(result.current.displayMode).toBe("empty");
  });

  it("should be funded when the user has balance and is ready", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ hasBalance: true, stableBalance: 1250.5 })),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      balance: 1250.5,
      filter: "all",
      isLoading: false,
    });
  });

  it("should be funded and loading while data loads", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ status: "loading", hasBalance: false })),
    );

    expect(result.current).toMatchObject({ displayMode: "funded", isLoading: true });
  });

  it("should be empty on error", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ status: "error", hasBalance: true })),
    );

    expect(result.current.displayMode).toBe("empty");
  });

  it("should expose the selected option for a valid filter", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ hasBalance: true, filter: USDC_ID })),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      filter: USDC_ID,
      selectedOption: { id: USDC_ID, ticker: "USDC" },
    });
  });

  it("should open the filter and track the open event", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ hasBalance: true, onTrackEvent })),
    );

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(false);

    act(() => result.current.displayMode === "funded" && result.current.onOpenFilter());

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(true);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });

  it("should close the filter", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ hasBalance: true })),
    );

    act(() => result.current.displayMode === "funded" && result.current.onOpenFilter());
    act(() => result.current.displayMode === "funded" && result.current.onCloseFilter());

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(false);
  });
});
