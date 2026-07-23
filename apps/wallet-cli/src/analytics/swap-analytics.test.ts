import { afterAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as segment from "./segment";
import {
  trackSwapCompleted,
  trackSwapFailed,
  trackSwapQuoteRequested,
  trackSwapQuoteReturned,
  trackSwapRejected,
  trackSwapSimulated,
  trackSwapStarted,
  trackSwapStatusPolled,
} from "./swap-analytics";

type TrackCall = { event: string; properties?: Record<string, unknown> | null };

const trackCalls: TrackCall[] = [];

const trackSpy = spyOn(segment, "track").mockImplementation((event, properties) => {
  trackCalls.push({ event, properties });
});

afterAll(() => {
  trackSpy.mockRestore();
});

describe("swap analytics", () => {
  beforeEach(() => {
    trackCalls.length = 0;
  });

  describe("trackSwapCompleted", () => {
    it("should call segment.track with swap_completed event including provider", () => {
      trackSwapCompleted({
        flowId: "flow-123",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        provider: "changelly",
        fromAmount: "0.5",
        toAmount: "8.2",
      });

      expect(trackCalls).toHaveLength(1);
      expect(trackCalls[0].event).toBe("swap_completed");
      expect(trackCalls[0].properties).toMatchObject({
        provider: "changelly",
        flowId: "flow-123",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        fromAmount: "0.5",
        toAmount: "8.2",
      });
    });

    it("should forward provider field to segment.track", () => {
      trackSwapCompleted({
        flowId: "flow-456",
        fromCurrency: "ETH",
        toCurrency: "USDC",
        provider: "thorswap",
        fromAmount: "1.0",
      });

      expect(trackCalls[0].properties).toMatchObject({ provider: "thorswap" });
    });

    it("should omit toAmount when not provided", () => {
      trackSwapCompleted({
        flowId: "flow-789",
        fromCurrency: "ETH",
        toCurrency: "USDC",
        provider: "thorswap",
        fromAmount: "1.0",
      });

      expect(trackCalls[0].properties?.toAmount).toBeUndefined();
    });
  });

  describe("trackSwapQuoteRequested", () => {
    it("should call segment.track with swapquote_requested event", () => {
      trackSwapQuoteRequested({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
      });

      expect(trackCalls[0].event).toBe("swapquote_requested");
      expect(trackCalls[0].properties).toMatchObject({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        deviceRequired: false,
      });
    });
  });

  describe("trackSwapQuoteReturned", () => {
    it("should call segment.track with swapquote_returned event", () => {
      trackSwapQuoteReturned({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        providersCount: 3,
      });

      expect(trackCalls[0].event).toBe("swapquote_returned");
      expect(trackCalls[0].properties).toMatchObject({ providersCount: 3 });
    });
  });

  describe("trackSwapSimulated", () => {
    it("should call segment.track with swap_simulated event including provider", () => {
      trackSwapSimulated({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        provider: "changelly",
      });

      expect(trackCalls[0].event).toBe("swap_simulated");
      expect(trackCalls[0].properties).toMatchObject({ provider: "changelly" });
    });
  });

  describe("trackSwapFailed", () => {
    it("should call segment.track with swap_failed event", () => {
      trackSwapFailed({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        errorCode: "INSUFFICIENT_FUNDS",
      });

      expect(trackCalls[0].event).toBe("swap_failed");
      expect(trackCalls[0].properties).toMatchObject({ errorCode: "INSUFFICIENT_FUNDS" });
    });
  });

  describe("trackSwapStarted", () => {
    it("should call segment.track with swap_started event including provider", () => {
      trackSwapStarted({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
        provider: "changelly",
        feeStrategy: "medium",
      });

      expect(trackCalls[0].event).toBe("swap_started");
      expect(trackCalls[0].properties).toMatchObject({
        provider: "changelly",
        feeStrategy: "medium",
      });
    });
  });

  describe("trackSwapRejected", () => {
    it("should call segment.track with swap_rejected event", () => {
      trackSwapRejected({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
      });

      expect(trackCalls[0].event).toBe("swap_rejected");
      expect(trackCalls[0].properties).toMatchObject({
        flowId: "flow-1",
        fromCurrency: "BTC",
        toCurrency: "ETH",
      });
    });
  });

  describe("trackSwapStatusPolled", () => {
    it("should call segment.track with swapstatus_polled event including provider", () => {
      trackSwapStatusPolled({
        flowId: "flow-1",
        swapId: "swap-abc",
        provider: "changelly",
      });

      expect(trackCalls[0].event).toBe("swapstatus_polled");
      expect(trackCalls[0].properties).toMatchObject({
        swapId: "swap-abc",
        provider: "changelly",
      });
    });
  });
});
