import { renderHook, act } from "tests/testSetup";
import { useSponsoredPollingViewModel } from "../useSponsoredPollingViewModel";

let mockSponsoredState: { phase: string };

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: mockSponsoredState, actions: {} }),
}));

describe("useSponsoredPollingViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredState = { phase: "POLLING" };
  });

  it("exposes a formatted elapsed label starting at 00:00", () => {
    const { result } = renderHook(() => useSponsoredPollingViewModel());

    expect(result.current.elapsedLabel).toContain("00:00");
    expect(result.current.waitingLabel.length).toBeGreaterThan(0);
  });

  it("increments the elapsed counter once per second while polling, and clears the interval on unmount", () => {
    jest.useFakeTimers();
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    try {
      const { result, unmount } = renderHook(() => useSponsoredPollingViewModel());

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.elapsedLabel).toContain("00:05");

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
    } finally {
      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    }
  });

  it("resets the elapsed counter to 00:00 when POLLING is re-entered after a retry", () => {
    jest.useFakeTimers();
    try {
      const { result, rerender } = renderHook(() => useSponsoredPollingViewModel());

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current.elapsedLabel).toContain("00:05");

      // A retry leaves POLLING then comes back to it — the new cycle must start from zero.
      mockSponsoredState = { phase: "RENT_SIGNING" };
      rerender();
      mockSponsoredState = { phase: "POLLING" };
      rerender();

      expect(result.current.elapsedLabel).toContain("00:00");
    } finally {
      jest.useRealTimers();
    }
  });
});
