import { renderHook } from "@testing-library/react";
import { useDevToolsStorage } from "./useDevToolsStorage.web";
import { MAX_RECENT_TOOLS, STORAGE_KEY, serialize } from "../utils/devToolsStorageUtils";

beforeEach(() => {
  localStorage.clear();
});

describe("useDevToolsStorage", () => {
  it("returns empty recentToolIds when storage is empty", () => {
    const { result } = renderHook(() => useDevToolsStorage(undefined, jest.fn()));
    expect(result.current.recentToolIds).toEqual([]);
  });

  it("does not call setActiveToolId when storage is empty", () => {
    const setActiveToolId = jest.fn();
    renderHook(() => useDevToolsStorage(undefined, setActiveToolId));
    expect(setActiveToolId).not.toHaveBeenCalled();
  });

  describe("on mount", () => {
    it("restores activeToolId from storage", () => {
      localStorage.setItem(STORAGE_KEY, serialize({ activeToolId: "feature-flags" }));
      const setActiveToolId = jest.fn();
      renderHook(() => useDevToolsStorage(undefined, setActiveToolId));
      expect(setActiveToolId).toHaveBeenCalledWith("feature-flags");
    });

    it("restores recentToolIds from storage", () => {
      localStorage.setItem(STORAGE_KEY, serialize({ recentToolIds: ["tool-a", "tool-b"] }));
      const { result } = renderHook(() => useDevToolsStorage(undefined, jest.fn()));
      expect(result.current.recentToolIds).toEqual(["tool-a", "tool-b"]);
    });

    it("ignores corrupted storage without throwing", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json");
      const setActiveToolId = jest.fn();
      expect(() => renderHook(() => useDevToolsStorage(undefined, setActiveToolId))).not.toThrow();
      expect(setActiveToolId).not.toHaveBeenCalled();
    });
  });

  describe("when activeToolId changes", () => {
    const initialProps: { id: string | undefined } = { id: undefined };

    it("prepends the new tool to recentToolIds", () => {
      const { result, rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      rerender({ id: "feature-flags" });
      expect(result.current.recentToolIds).toEqual(["feature-flags"]);
    });

    it("moves an existing tool to the front instead of duplicating", () => {
      localStorage.setItem(STORAGE_KEY, serialize({ recentToolIds: ["tool-a", "tool-b"] }));
      const { result, rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      rerender({ id: "tool-b" });
      expect(result.current.recentToolIds).toEqual(["tool-b", "tool-a"]);
    });

    it("writes to storage", () => {
      const { rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      rerender({ id: "feature-flags" });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.activeToolId).toBe("feature-flags");
      expect(stored.recentToolIds).toEqual(["feature-flags"]);
    });

    it("skips the storage write when the tool is already first in recents", () => {
      localStorage.setItem(STORAGE_KEY, serialize({ recentToolIds: ["feature-flags"] }));
      const { rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      localStorage.clear();
      rerender({ id: "feature-flags" });
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("does not restore a cleared tool on the next mount", () => {
      const { rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      rerender({ id: "feature-flags" });
      rerender({ id: undefined });

      const setActiveToolId = jest.fn();
      renderHook(() => useDevToolsStorage(undefined, setActiveToolId));
      expect(setActiveToolId).not.toHaveBeenCalled();
    });

    it("caps recentToolIds at MAX_RECENT_TOOLS", () => {
      const ids = Array.from({ length: MAX_RECENT_TOOLS }, (_, i) => `tool-${i}`);
      localStorage.setItem(STORAGE_KEY, serialize({ recentToolIds: ids }));
      const { result, rerender } = renderHook(({ id }) => useDevToolsStorage(id, jest.fn()), {
        initialProps,
      });
      rerender({ id: "new-tool" });
      expect(result.current.recentToolIds).toHaveLength(MAX_RECENT_TOOLS);
      expect(result.current.recentToolIds[0]).toBe("new-tool");
    });
  });
});
