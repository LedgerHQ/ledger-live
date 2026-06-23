import { renderHook, act } from "tests/testSetup";
import { useCyclingPlaceholder, PLACEHOLDER_INTERVAL_MS } from "../useCyclingPlaceholder";

describe("useCyclingPlaceholder", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("starts on the first phrase and animates when there are several phrases", () => {
    const { result } = renderHook(() => useCyclingPlaceholder(4, true));

    expect(result.current.index).toBe(0);
    expect(result.current.animate).toBe(true);
  });

  it("advances to the next phrase after each interval and wraps around", () => {
    const { result } = renderHook(() => useCyclingPlaceholder(4, true));

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS);
    });
    expect(result.current.index).toBe(1);

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS * 3);
    });
    expect(result.current.index).toBe(0);
  });

  it("pauses cycling while disabled", () => {
    const { result } = renderHook(() => useCyclingPlaceholder(4, false));

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS * 2);
    });
    expect(result.current.index).toBe(0);
  });

  it("does not cycle when there is a single phrase", () => {
    const { result } = renderHook(() => useCyclingPlaceholder(1, true));

    expect(result.current.animate).toBe(false);

    act(() => {
      jest.advanceTimersByTime(PLACEHOLDER_INTERVAL_MS * 2);
    });
    expect(result.current.index).toBe(0);
  });
});
