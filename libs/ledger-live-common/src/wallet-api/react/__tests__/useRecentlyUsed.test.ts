/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useRecentlyUsed } from "../useRecentlyUsed";
import { MAX_RECENTLY_USED_LENGTH } from "../../constants";
import { createAppManifest } from "../../logic/__tests__/testHelpers";
import type { RecentlyUsedDB } from "../types";
import type { AppManifest } from "../../types";

type RecentlyUsedEntry = { id: string; usedAt: string };

function createDb(recentlyUsed: RecentlyUsedEntry[]): { db: RecentlyUsedDB; setState: jest.Mock } {
  const setState = jest.fn();
  const db = [recentlyUsed, setState, false] as unknown as RecentlyUsedDB;
  return { db, setState };
}

describe("useRecentlyUsed", () => {
  describe("data", () => {
    it("merges manifest data with computed usedAt and filters unknown ids", () => {
      const manifests = [createAppManifest("a"), createAppManifest("b")];
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const { db } = createDb([
        { id: "a", usedAt: fiveMinAgo },
        { id: "missing", usedAt: now.toISOString() },
      ]);

      const { result } = renderHook(() => useRecentlyUsed(manifests, db));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe("a");
      expect(result.current.data[0].usedAt.unit).toBe("minutes");
      expect(result.current.data[0].usedAt.diff).toBe(5);
    });

    it("returns empty data when the db list is empty", () => {
      const { db } = createDb([]);
      const { result } = renderHook(() => useRecentlyUsed([createAppManifest("a")], db));
      expect(result.current.data).toEqual([]);
    });
  });

  describe("clear", () => {
    it("empties the recentlyUsed list", () => {
      const { db, setState } = createDb([{ id: "a", usedAt: new Date().toISOString() }]);
      const { result } = renderHook(() => useRecentlyUsed([], db));

      act(() => result.current.clear());

      const updater = setState.mock.calls[0][0];
      expect(updater({ recentlyUsed: [{ id: "a", usedAt: "x" }], other: 1 })).toEqual({
        recentlyUsed: [],
        other: 1,
      });
    });
  });

  describe("append", () => {
    function runAppend(
      initial: RecentlyUsedEntry[],
      manifest: AppManifest,
    ): { recentlyUsed: RecentlyUsedEntry[] } {
      const { db, setState } = createDb(initial);
      const { result } = renderHook(() => useRecentlyUsed([], db));
      act(() => result.current.append(manifest));
      const updater = setState.mock.calls[0][0];
      return updater({ recentlyUsed: initial });
    }

    it("only refreshes usedAt when the manifest is already first", () => {
      const initial = [
        { id: "a", usedAt: "old-a" },
        { id: "b", usedAt: "old-b" },
      ];
      const next = runAppend(initial, createAppManifest("a"));

      expect(next.recentlyUsed.map(e => e.id)).toEqual(["a", "b"]);
      expect(next.recentlyUsed[0].usedAt).not.toBe("old-a");
      expect(next.recentlyUsed[1].usedAt).toBe("old-b");
    });

    it("moves an existing (non-first) manifest to the front", () => {
      const initial = [
        { id: "a", usedAt: "old-a" },
        { id: "b", usedAt: "old-b" },
        { id: "c", usedAt: "old-c" },
      ];
      const next = runAppend(initial, createAppManifest("c"));

      expect(next.recentlyUsed.map(e => e.id)).toEqual(["c", "a", "b"]);
    });

    it("prepends a brand new manifest", () => {
      const initial = [{ id: "a", usedAt: "old-a" }];
      const next = runAppend(initial, createAppManifest("new"));

      expect(next.recentlyUsed.map(e => e.id)).toEqual(["new", "a"]);
    });

    it("drops the last entry when at max length", () => {
      const initial = Array.from({ length: MAX_RECENTLY_USED_LENGTH }, (_, i) => ({
        id: `id-${i}`,
        usedAt: `t-${i}`,
      }));
      const next = runAppend(initial, createAppManifest("new"));

      expect(next.recentlyUsed).toHaveLength(MAX_RECENTLY_USED_LENGTH);
      expect(next.recentlyUsed[0].id).toBe("new");
      // last original entry (id-9) is dropped
      expect(next.recentlyUsed.map(e => e.id)).not.toContain(`id-${MAX_RECENTLY_USED_LENGTH - 1}`);
    });
  });
});
