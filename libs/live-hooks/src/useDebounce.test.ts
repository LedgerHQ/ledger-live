import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

jest.useFakeTimers();

describe("useDebounce", () => {
  test("it delays the update", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 1, delay: 1000 },
    });
    expect(result.current).toBe(1);
    rerender({ value: 2, delay: 1000 });
    expect(result.current).toBe(1);
    act(() => jest.advanceTimersByTime(900));
    expect(result.current).toBe(1);
    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe(2);
  });
});
