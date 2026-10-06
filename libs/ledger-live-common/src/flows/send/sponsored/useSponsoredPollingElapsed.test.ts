/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { SPONSORED_PHASE, type SponsoredPhase } from "./types";
import { useSponsoredPollingElapsed } from "./useSponsoredPollingElapsed";

describe("useSponsoredPollingElapsed", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("counts seconds while polling and restarts on the next entry", () => {
    const { result, rerender } = renderHook(
      ({ phase }: { phase: SponsoredPhase }) => useSponsoredPollingElapsed(phase),
      { initialProps: { phase: SPONSORED_PHASE.POLLING as SponsoredPhase } },
    );
    expect(result.current).toBe("00:00");

    act(() => jest.advanceTimersByTime(65_000));
    expect(result.current).toBe("01:05");

    rerender({ phase: SPONSORED_PHASE.TRANSFER });
    act(() => jest.advanceTimersByTime(5_000));
    expect(result.current).toBe("01:05");

    rerender({ phase: SPONSORED_PHASE.POLLING });
    expect(result.current).toBe("00:00");
  });
});
