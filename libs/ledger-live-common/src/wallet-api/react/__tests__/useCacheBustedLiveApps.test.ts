/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useCacheBustedLiveApps } from "../useCacheBustedLiveApps";
import type { CacheBustedLiveAppsDB } from "../types";

function createDb(value: Record<string, number> = { init: 1 }): {
  db: CacheBustedLiveAppsDB;
  setState: jest.Mock;
} {
  const setState = jest.fn();
  const db = [value, setState, false] as unknown as CacheBustedLiveAppsDB;
  return { db, setState };
}

describe("useCacheBustedLiveApps", () => {
  describe("getLatest", () => {
    it("returns the cache busting id for a known manifest", () => {
      const { db } = createDb({ init: 1, "app-1": 42 });
      const { result } = renderHook(() => useCacheBustedLiveApps(db));

      expect(result.current.getLatest("app-1")).toBe(42);
    });

    it("returns undefined for an unknown manifest", () => {
      const { db } = createDb({ init: 1 });
      const { result } = renderHook(() => useCacheBustedLiveApps(db));

      expect(result.current.getLatest("unknown")).toBeUndefined();
    });

    it("returns undefined when db is undefined", () => {
      const setState = jest.fn();
      const db = [undefined, setState, false] as unknown as CacheBustedLiveAppsDB;
      const { result } = renderHook(() => useCacheBustedLiveApps(db));

      expect(result.current.getLatest("app-1")).toBeUndefined();
    });
  });

  describe("edit", () => {
    it("merges the new cache busting id into state and keeps init", () => {
      const { db, setState } = createDb({ init: 1, existing: 5 });
      const { result } = renderHook(() => useCacheBustedLiveApps(db));

      act(() => {
        result.current.edit("app-1", 99);
      });

      expect(setState).toHaveBeenCalledTimes(1);
      const updater = setState.mock.calls[0][0];
      const prevState = { someOtherKey: true };
      expect(updater(prevState)).toEqual({
        someOtherKey: true,
        cacheBustedLiveApps: { init: 1, existing: 5, "app-1": 99 },
      });
    });

    it("forces init to 1 in the resulting cache map", () => {
      const { db, setState } = createDb({});
      const { result } = renderHook(() => useCacheBustedLiveApps(db));

      act(() => {
        result.current.edit("app-1", 7);
      });

      const updater = setState.mock.calls[0][0];
      expect(updater({}).cacheBustedLiveApps).toEqual({ "app-1": 7, init: 1 });
    });
  });
});
