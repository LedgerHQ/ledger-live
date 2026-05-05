import { act, renderHook } from "@testing-library/react";
import { useAccordion } from "./useAccordion";

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

  describe("openKey", () => {
    it("expands the given key without toggling", () => {
      const { result } = renderHook(() => useAccordion<string>({ openKey: "a" }));
      expect(result.current.isExpanded("a")).toBe(true);
      expect(result.current.isExpanded("b")).toBe(false);
    });

    it("changing openKey expands the new key and collapses the old one (when untouched by toggle)", () => {
      const { result, rerender } = renderHook(({ openKey }) => useAccordion<string>({ openKey }), {
        initialProps: { openKey: "a" as string | undefined },
      });
      expect(result.current.isExpanded("a")).toBe(true);

      rerender({ openKey: "b" });
      expect(result.current.isExpanded("a")).toBe(false);
      expect(result.current.isExpanded("b")).toBe(true);
    });

    it("the openKey can be closed by toggling it", () => {
      const { result } = renderHook(() => useAccordion<string>({ openKey: "a" }));
      act(() => result.current.toggle("a"));
      expect(result.current.isExpanded("a")).toBe(false);
    });

    it("toggling another key closes the openKey in single mode", () => {
      const { result } = renderHook(() => useAccordion<string>({ openKey: "a" }));
      act(() => result.current.toggle("b"));
      expect(result.current.isExpanded("a")).toBe(false);
      expect(result.current.isExpanded("b")).toBe(true);
    });

    it("works without openKey: toggle state is used directly", () => {
      const { result } = renderHook(({ openKey }) => useAccordion<string>({ openKey }), {
        initialProps: { openKey: undefined as string | undefined },
      });
      act(() => result.current.toggle("a"));
      expect(result.current.isExpanded("a")).toBe(true);
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
