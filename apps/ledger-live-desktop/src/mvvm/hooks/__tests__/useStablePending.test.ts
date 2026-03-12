import { act, renderHook } from "tests/testSetup";
import { useStablePending } from "../useStablePending";
import { POLLING_FINISHED_DELAY_MS } from "LLD/utils/constants";

function renderStablePending(initialPending: boolean, delayMs: number = POLLING_FINISHED_DELAY_MS) {
  return renderHook((props: { pending: boolean }) => useStablePending(props.pending, delayMs), {
    initialProps: { pending: initialPending },
  });
}

describe("useStablePending", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns true when pending is true", () => {
    const { result, rerender } = renderStablePending(true);
    expect(result.current).toBe(true);
    rerender({ pending: true });
    expect(result.current).toBe(true);
  });

  it("returns false when pending is false on initial render", () => {
    const { result } = renderStablePending(false);
    expect(result.current).toBe(false);
  });

  it("stays true for delayMs after pending goes from true to false", () => {
    const { result, rerender } = renderStablePending(true);
    expect(result.current).toBe(true);

    rerender({ pending: false });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(POLLING_FINISHED_DELAY_MS - 1);
    });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("stays true if pending goes true again before delay elapses", () => {
    const { result, rerender } = renderStablePending(true);
    rerender({ pending: false });
    expect(result.current).toBe(true);

    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ pending: true });
    act(() => {
      jest.advanceTimersByTime(POLLING_FINISHED_DELAY_MS);
    });
    expect(result.current).toBe(true);
  });

  it("uses custom delayMs", () => {
    const { result, rerender } = renderStablePending(true, 100);
    rerender({ pending: false });
    expect(result.current).toBe(true);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });
});
