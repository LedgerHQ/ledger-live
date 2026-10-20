/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useThrottledValues } from "./useThrottledValues";

describe("useThrottledValues", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns the initial values, then only the latest values once the delay elapsed", () => {
    const { result, rerender } = renderHook(({ values }) => useThrottledValues(values, 1000), {
      initialProps: { values: [1, "a"] },
    });
    expect(result.current).toEqual([1, "a"]);

    rerender({ values: [2, "a"] });
    rerender({ values: [3, "b"] });
    expect(result.current).toEqual([1, "a"]);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toEqual([3, "b"]);
  });

  it("updates right away when the delay already elapsed", () => {
    const { result, rerender } = renderHook(({ values }) => useThrottledValues(values, 1000), {
      initialProps: { values: [1] },
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    rerender({ values: [2] });
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(result.current).toEqual([2]);
  });
});
