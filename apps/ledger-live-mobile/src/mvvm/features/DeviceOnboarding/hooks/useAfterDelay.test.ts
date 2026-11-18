import { act, renderHook } from "@tests/test-renderer";
import { useAfterDelay } from "./useAfterDelay";

const delayMs = 20_000;

function renderAfterDelay(initialActive: boolean) {
  let active = initialActive;
  const hook = renderHook(() => useAfterDelay(active, delayMs));
  return {
    result: hook.result,
    setActive: (next: boolean) => {
      active = next;
      hook.rerender(undefined);
    },
  };
}

describe("useAfterDelay", () => {
  it("should turn true only once active has lasted the whole delay", () => {
    const { result } = renderAfterDelay(true);

    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(delayMs - 1));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("should never turn true when active stops before the delay", () => {
    const { result, setActive } = renderAfterDelay(true);

    act(() => jest.advanceTimersByTime(delayMs - 1_000));
    setActive(false);
    act(() => jest.advanceTimersByTime(5_000));

    expect(result.current).toBe(false);
  });

  it("should go back to false when active stops, and count the delay again on the next start", () => {
    const { result, setActive } = renderAfterDelay(true);
    act(() => jest.advanceTimersByTime(delayMs));
    expect(result.current).toBe(true);

    setActive(false);
    expect(result.current).toBe(false);

    setActive(true);
    act(() => jest.advanceTimersByTime(delayMs - 1));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });
});
