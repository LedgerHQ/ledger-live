import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Category, type Tool } from "@devtools/registry";
import { DevToolsShellProvider, useDevToolsShell, type CategoryGroup } from "./shellContext";

const categories: CategoryGroup[] = [
  {
    category: Category.DEBUGGING,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    tools: [{ id: "feature-flags" } as Tool],
  },
];

const wrapper =
  (value: { categories: CategoryGroup[] }) =>
  ({ children }: { children: ReactNode }) => (
    <DevToolsShellProvider value={value}>{children}</DevToolsShellProvider>
  );

describe("useDevToolsShell", () => {
  describe("without a provider", () => {
    it("returns empty categories", () => {
      const { result } = renderHook(() => useDevToolsShell());
      expect(result.current.categories).toEqual([]);
    });

    it("returns an empty query", () => {
      const { result } = renderHook(() => useDevToolsShell());
      expect(result.current.query).toBe("");
    });

    it("provides a no-op setQuery", () => {
      const { result } = renderHook(() => useDevToolsShell());
      expect(() => result.current.setQuery("anything")).not.toThrow();
    });
  });

  describe("with a provider", () => {
    it("exposes the categories from the provided value", () => {
      const { result } = renderHook(() => useDevToolsShell(), { wrapper: wrapper({ categories }) });
      expect(result.current.categories).toBe(categories);
    });

    it("starts with an empty query", () => {
      const { result } = renderHook(() => useDevToolsShell(), { wrapper: wrapper({ categories }) });
      expect(result.current.query).toBe("");
    });

    it("updates the query via setQuery", () => {
      const { result } = renderHook(() => useDevToolsShell(), { wrapper: wrapper({ categories }) });
      act(() => result.current.setQuery("flags"));
      expect(result.current.query).toBe("flags");
    });

    it("keeps the provided categories after the query changes", () => {
      const { result } = renderHook(() => useDevToolsShell(), { wrapper: wrapper({ categories }) });
      act(() => result.current.setQuery("flags"));
      expect(result.current.categories).toBe(categories);
    });
  });
});
