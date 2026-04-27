import { act, renderHook } from "@testing-library/react";
import { useAccordion } from "../../hooks/useAccordion";

describe("useAccordion", () => {
  it("starts with all keys collapsed", () => {
    const { result } = renderHook(() => useAccordion<string>());
    expect(result.current.isExpanded("a")).toBe(false);
  });

  it("expands a key on toggle", () => {
    const { result } = renderHook(() => useAccordion<string>());
    act(() => result.current.toggle("a"));
    expect(result.current.isExpanded("a")).toBe(true);
  });

  it("collapses an expanded key on second toggle", () => {
    const { result } = renderHook(() => useAccordion<string>());
    act(() => result.current.toggle("a"));
    act(() => result.current.toggle("a"));
    expect(result.current.isExpanded("a")).toBe(false);
  });

  describe("expand", () => {
    it("opens a collapsed key", () => {
      const { result } = renderHook(() => useAccordion<string>());
      act(() => result.current.expand("a"));
      expect(result.current.isExpanded("a")).toBe(true);
    });

    it("does not close an already-open key", () => {
      const { result } = renderHook(() => useAccordion<string>());
      act(() => result.current.expand("a"));
      act(() => result.current.expand("a"));
      expect(result.current.isExpanded("a")).toBe(true);
    });

    it("in single mode: closes the open key when a different key is expanded", () => {
      const { result } = renderHook(() => useAccordion<string>());
      act(() => result.current.expand("a"));
      act(() => result.current.expand("b"));
      expect(result.current.isExpanded("a")).toBe(false);
      expect(result.current.isExpanded("b")).toBe(true);
    });

    it("in multi mode: opens multiple keys independently", () => {
      const { result } = renderHook(() => useAccordion<string>({ mode: "multi" }));
      act(() => result.current.expand("a"));
      act(() => result.current.expand("b"));
      expect(result.current.isExpanded("a")).toBe(true);
      expect(result.current.isExpanded("b")).toBe(true);
    });
  });

  describe("single mode (default)", () => {
    it("collapses the previous key when a new key is expanded", () => {
      const { result } = renderHook(() => useAccordion<string>());
      act(() => result.current.toggle("a"));
      act(() => result.current.toggle("b"));
      expect(result.current.isExpanded("a")).toBe(false);
      expect(result.current.isExpanded("b")).toBe(true);
    });
  });

  describe("multi mode", () => {
    it("expands multiple keys independently", () => {
      const { result } = renderHook(() => useAccordion<string>({ mode: "multi" }));
      act(() => result.current.toggle("a"));
      act(() => result.current.toggle("b"));
      expect(result.current.isExpanded("a")).toBe(true);
      expect(result.current.isExpanded("b")).toBe(true);
    });

    it("collapses one key without affecting others", () => {
      const { result } = renderHook(() => useAccordion<string>({ mode: "multi" }));
      act(() => result.current.toggle("a"));
      act(() => result.current.toggle("b"));
      act(() => result.current.toggle("a"));
      expect(result.current.isExpanded("a")).toBe(false);
      expect(result.current.isExpanded("b")).toBe(true);
    });
  });
});
