import { act, renderHook } from "@tests/test-renderer";
import { useChartSectionModel } from "../useChartSectionModel";
import type { ChartSectionModelInput } from "../types";
import { chartSectionInitialState } from "./fixtures";

const input: ChartSectionModelInput = {
  prices: [1000, 1200],
  timestamps: [1, 2],
  valueChange: { value: 200, percentage: 0.2 },
  isVariationAvailable: true,
  isChartLoading: false,
  contextKey: "eth",
  balance: { amount: 1200, isLoading: false, isAvailable: true },
};

function renderModel(initial: ChartSectionModelInput = input) {
  let props = initial;
  const view = renderHook(() => useChartSectionModel(props), {
    overrideInitialState: chartSectionInitialState,
  });
  const rerender = (next: ChartSectionModelInput) => {
    props = next;
    view.rerender({});
  };
  return { ...view, rerender };
}

describe("useChartSectionModel", () => {
  it("should pass the scoped balance and loading states to the header and chart", () => {
    const { result } = renderModel({ ...input, isChartLoading: true, isVariationLoading: true });
    expect(result.current.header.balance).toEqual(input.balance);
    expect(result.current.header.isVariationLoading).toBe(true);
    expect(result.current.chart.isLoading).toBe(true);
  });

  it("should drop the scrubbed point once the selection changes", () => {
    const { result, rerender } = renderModel();
    act(() => result.current.chart.onScrubberPositionChange?.(0));
    expect(result.current.header.hoveredBalance).toBe(1000);

    rerender({ ...input, contextKey: "btc" });

    expect(result.current.header.hoveredBalance).toBeNull();
  });

  it("should keep the scrubbed point while the selection stays the same", () => {
    const { result, rerender } = renderModel();
    act(() => result.current.chart.onScrubberPositionChange?.(1));
    rerender({ ...input });
    expect(result.current.header.hoveredBalance).toBe(1200);
  });

  it("should not dispatch anything while scrubbing", () => {
    const { result, store } = renderModel();
    const before = store.getState();
    act(() => result.current.chart.onScrubberPositionChange?.(0));
    expect(store.getState()).toBe(before);
  });
});
