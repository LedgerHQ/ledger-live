/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useLocalLiveApp } from "../useLocalLiveApp";
import { INITIAL_PLATFORM_STATE } from "../../constants";
import type { LocalLiveAppDB } from "../types";
import type { LiveAppManifest } from "../../../platform/types";

function liveApp(id: string): LiveAppManifest {
  return { id } as LiveAppManifest;
}

function createDb(value: LiveAppManifest[] | undefined): {
  db: LocalLiveAppDB;
  setState: jest.Mock;
} {
  const setState = jest.fn();
  const db = [value, setState, false] as unknown as LocalLiveAppDB;
  return { db, setState };
}

describe("useLocalLiveApp", () => {
  it("returns the db value as state", () => {
    const apps = [liveApp("a")];
    const { db } = createDb(apps);
    const { result } = renderHook(() => useLocalLiveApp(db));

    expect(result.current.state).toBe(apps);
  });

  it("initializes state when the db value is undefined", () => {
    const { db, setState } = createDb(undefined);
    renderHook(() => useLocalLiveApp(db));

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    expect(updater({ foo: 1 })).toEqual({
      foo: 1,
      localLiveApp: INITIAL_PLATFORM_STATE.localLiveApp,
    });
  });

  it("does not initialize when the db value is defined", () => {
    const { db, setState } = createDb([]);
    renderHook(() => useLocalLiveApp(db));

    expect(setState).not.toHaveBeenCalled();
  });

  describe("addLocalManifest", () => {
    it("appends a new manifest", () => {
      const { db, setState } = createDb([liveApp("existing")]);
      const { result } = renderHook(() => useLocalLiveApp(db));

      act(() => result.current.addLocalManifest(liveApp("new")));

      const updater = setState.mock.calls[0][0];
      const next = updater({ localLiveApp: [liveApp("existing")] });
      expect(next.localLiveApp.map((m: LiveAppManifest) => m.id)).toEqual(["existing", "new"]);
    });

    it("replaces a manifest with the same id (dedupe)", () => {
      const { db, setState } = createDb([liveApp("dup")]);
      const { result } = renderHook(() => useLocalLiveApp(db));

      act(() => result.current.addLocalManifest(liveApp("dup")));

      const updater = setState.mock.calls[0][0];
      const next = updater({ localLiveApp: [liveApp("dup")] });
      expect(next.localLiveApp.map((m: LiveAppManifest) => m.id)).toEqual(["dup"]);
    });
  });

  describe("removeLocalManifestById", () => {
    it("removes the manifest matching the id", () => {
      const { db, setState } = createDb([liveApp("a"), liveApp("b")]);
      const { result } = renderHook(() => useLocalLiveApp(db));

      act(() => result.current.removeLocalManifestById("a"));

      const updater = setState.mock.calls[0][0];
      const next = updater({ localLiveApp: [liveApp("a"), liveApp("b")] });
      expect(next.localLiveApp.map((m: LiveAppManifest) => m.id)).toEqual(["b"]);
    });
  });

  describe("getLocalLiveAppManifestById", () => {
    it("finds a manifest by id", () => {
      const { db } = createDb([liveApp("a"), liveApp("b")]);
      const { result } = renderHook(() => useLocalLiveApp(db));

      expect(result.current.getLocalLiveAppManifestById("b")?.id).toBe("b");
    });

    it("returns undefined when not found", () => {
      const { db } = createDb([liveApp("a")]);
      const { result } = renderHook(() => useLocalLiveApp(db));

      expect(result.current.getLocalLiveAppManifestById("missing")).toBeUndefined();
    });
  });
});
