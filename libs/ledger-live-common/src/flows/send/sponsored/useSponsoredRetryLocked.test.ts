/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useSponsoredRetryLocked } from "./useSponsoredRetryLocked";

const render = (retryLockedUntil: number | null) =>
  renderHook(({ until }: { until: number | null }) => useSponsoredRetryLocked(until), {
    initialProps: { until: retryLockedUntil },
  });

describe("useSponsoredRetryLocked", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("stays locked until the time passes, then unlocks", () => {
    const { result } = render(Date.now() + 60_000);
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(59_999));
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it("is unlocked without a lock", () => {
    expect(render(null).result.current).toBe(false);
  });

  it("unlocks a lock whose time has already passed on the next tick", () => {
    const { result } = render(Date.now() - 1);

    act(() => jest.advanceTimersByTime(0));

    expect(result.current).toBe(false);
  });

  it("follows a lock set, moved and lifted after mount", () => {
    const { result, rerender } = render(null);

    rerender({ until: Date.now() + 10_000 });
    expect(result.current).toBe(true);

    rerender({ until: Date.now() + 20_000 });
    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current).toBe(true);

    rerender({ until: null });
    expect(result.current).toBe(false);
  });
});
