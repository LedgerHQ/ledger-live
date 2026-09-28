import { renderHook, act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useSponsoredPollingViewModel } from "../useSponsoredPollingViewModel";

const mockTrack = jest.fn();
const mockTrackPage = jest.fn();
jest.mock("~/renderer/analytics/segment", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
  trackPage: (...args: unknown[]) => mockTrackPage(...args),
}));

jest.mock("../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({ flow: "send", currency: "USDT" }),
}));

const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

let mockSponsoredState: { phase: string; order?: { orderId: string; payCoinAmt: string; payCoinCode: string } | null };

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: mockSponsoredState,
    actions: {},
    quote: { savings: 5_000_000n },
    savingsFiatFormatted: "$0.50",
  }),
}));

describe("useSponsoredPollingViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredState = {
      phase: "POLLING",
      order: { orderId: "order-1", payCoinAmt: "5.0", payCoinCode: "TRX" },
    };
  });

  it("does not navigate while phase is POLLING and exposes a formatted elapsed label", () => {
    const { result } = renderHook(() => useSponsoredPollingViewModel());

    expect(mockGoToStep).not.toHaveBeenCalled();
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

  it("navigates to the existing SIGNATURE step when the phase transitions to TRANSFER", () => {
    const { rerender } = renderHook(() => useSponsoredPollingViewModel());

    mockSponsoredState = { phase: "TRANSFER" };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SIGNATURE);
  });

  it("navigates to SPONSORED_FAILURE when the phase transitions to FAILED", () => {
    const { rerender } = renderHook(() => useSponsoredPollingViewModel());

    mockSponsoredState = { phase: "FAILED" };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_FAILURE);
  });

  it("does not re-dispatch navigation on a same-phase re-render", () => {
    const { rerender } = renderHook(() => useSponsoredPollingViewModel());

    mockSponsoredState = { phase: "TRANSFER" };
    rerender();
    rerender();

    expect(mockGoToStep).toHaveBeenCalledTimes(1);
  });

  it("does not navigate while the phase stays RENT_SIGNING or IDLE", () => {
    mockSponsoredState = { phase: "RENT_SIGNING" };
    const { rerender } = renderHook(() => useSponsoredPollingViewModel());

    mockSponsoredState = { phase: "IDLE" };
    rerender();

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it("tracks the polling page on mount", () => {
    renderHook(() => useSponsoredPollingViewModel());

    expect(mockTrackPage).toHaveBeenCalledWith(
      "Modal send - step sponsored polling",
      null,
      expect.objectContaining({ flow: "send" }),
    );
  });

  it("emits gas_sponsorship_energy_delivered when the phase transitions to TRANSFER", () => {
    const { rerender } = renderHook(() => useSponsoredPollingViewModel());

    mockSponsoredState = { ...mockSponsoredState, phase: "TRANSFER" };
    rerender();

    expect(mockTrack).toHaveBeenCalledWith(
      "gas_sponsorship_energy_delivered",
      expect.objectContaining({ provider: "tronify", orderId: "order-1" }),
    );
  });
});
