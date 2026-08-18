import { renderHook, act } from "@testing-library/react";
import type { Envelope, MessageMap } from "@devtools/transport";
import { useHistoryLine } from "./useHistoryLine";

function makeEnvelope(overrides?: Partial<Envelope<MessageMap>>): Envelope<MessageMap> {
  return {
    id: "abc123",
    seq: 1,
    ts: 0,
    origin: "remote",
    kind: "debug",
    payload: "hello",
    ...overrides,
  };
}

describe("useHistoryLine", () => {
  describe("isSent", () => {
    it("is true when envelope origin matches localOrigin", () => {
      const { result } = renderHook(() =>
        useHistoryLine(makeEnvelope({ origin: "local" }), "local"),
      );
      expect(result.current.isSent).toBe(true);
    });

    it("is false when envelope origin differs from localOrigin", () => {
      const { result } = renderHook(() =>
        useHistoryLine(makeEnvelope({ origin: "remote" }), "local"),
      );
      expect(result.current.isSent).toBe(false);
    });
  });

  describe("collapsedText", () => {
    it("renders the full line when shorter than the limit", () => {
      const envelope = makeEnvelope({ seq: 1, kind: "debug", id: "x", payload: "hi" });
      const { result } = renderHook(() => useHistoryLine(envelope, "local"));
      expect(result.current.collapsedText).not.toContain("…");
    });

    it("truncates lines longer than 50 chars with an ellipsis", () => {
      const longPayload = "a".repeat(200);
      const envelope = makeEnvelope({ payload: longPayload });
      const { result } = renderHook(() => useHistoryLine(envelope, "local"));
      expect(result.current.collapsedText.endsWith("…")).toBe(true);
      expect(result.current.collapsedText.length).toBeLessThanOrEqual(51);
    });
  });

  describe("expandedText", () => {
    it("is pretty-printed JSON of the full envelope", () => {
      const envelope = makeEnvelope({ payload: "world" });
      const { result } = renderHook(() => useHistoryLine(envelope, "local"));
      const parsed = JSON.parse(result.current.expandedText);
      expect(parsed).toMatchObject({ id: envelope.id, origin: envelope.origin, payload: "world" });
    });

    it("replaces payload with a placeholder when JSON exceeds 500 chars", () => {
      const envelope = makeEnvelope({ payload: "x".repeat(600) });
      const { result } = renderHook(() => useHistoryLine(envelope, "local"));
      const parsed = JSON.parse(result.current.expandedText);
      expect(parsed.payload).toBe("Output too big to display");
    });
  });

  describe("isExpanded", () => {
    it("starts as false", () => {
      const { result } = renderHook(() => useHistoryLine(makeEnvelope(), "local"));
      expect(result.current.isExpanded).toBe(false);
    });

    it("toggles to true when setIsExpanded(true) is called", () => {
      const { result } = renderHook(() => useHistoryLine(makeEnvelope(), "local"));
      act(() => result.current.setIsExpanded(true));
      expect(result.current.isExpanded).toBe(true);
    });
  });
});
