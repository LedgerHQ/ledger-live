import { act, renderHook } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { ALL_FLAG_IDS } from "../constants";
import type { FeatureId, PartialFeatures } from "@shared/feature-flags";
import { useSortFlag } from "./useSortFlag";
import type { SortFlagProps } from "./useSortFlag";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const testFlagId: FeatureId = "mockFeature";

const byName = [...ALL_FLAG_IDS].sort((a, b) => a.localeCompare(b));

const defaultInput: SortFlagProps = {
  flagIds: [...ALL_FLAG_IDS].reverse(),
  resolved,
  overrides: {},
};

describe("useSortFlag", () => {
  describe("defaults", () => {
    it("starts sorted by name", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      expect(result.current.category).toBe("name");
    });

    it("starts ascending", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      expect(result.current.direction).toBe("asc");
    });
  });

  describe("name sorting", () => {
    it("sorts ascending by id", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      expect(result.current.sortedFlagIds).toEqual(byName);
    });

    it("sorts descending when direction is desc", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.setSort("name", "desc"));
      expect(result.current.sortedFlagIds).toEqual([...byName].reverse());
    });
  });

  describe("enabled sorting", () => {
    it("groups enabled flags before disabled flags", () => {
      const resolvedWithEnabled: typeof resolved = { ...resolved, mockFeature: { enabled: true } };
      const { result } = renderHook(() =>
        useSortFlag({ ...defaultInput, resolved: resolvedWithEnabled }),
      );
      act(() => result.current.setSort("enabled", "asc"));

      const ids = result.current.sortedFlagIds;
      const firstDisabledIndex = ids.findIndex(id => !resolvedWithEnabled[id].enabled);
      expect(ids.slice(0, firstDisabledIndex).every(id => resolvedWithEnabled[id].enabled)).toBe(
        true,
      );
      expect(ids.slice(firstDisabledIndex).every(id => !resolvedWithEnabled[id].enabled)).toBe(
        true,
      );
    });
  });

  describe("overridden sorting", () => {
    it("places overridden flags first", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { result } = renderHook(() => useSortFlag({ ...defaultInput, overrides }));
      act(() => result.current.setSort("overridden", "asc"));
      expect(result.current.sortedFlagIds[0]).toBe(testFlagId);
    });
  });

  describe("setSort", () => {
    it("sets the category", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.setSort("enabled", "asc"));
      expect(result.current.category).toBe("enabled");
    });

    it("sets the direction", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.setSort("name", "desc"));
      expect(result.current.direction).toBe("desc");
    });
  });

  describe("toggleDirection", () => {
    it("flips ascending to descending", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.toggleDirection());
      expect(result.current.direction).toBe("desc");
    });

    it("flips descending back to ascending", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.toggleDirection());
      act(() => result.current.toggleDirection());
      expect(result.current.direction).toBe("asc");
    });
  });

  describe("cycleCategory", () => {
    it("steps from name to overridden", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.cycleCategory());
      expect(result.current.category).toBe("overridden");
    });

    it("steps from overridden to enabled", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.cycleCategory());
      act(() => result.current.cycleCategory());
      expect(result.current.category).toBe("enabled");
    });

    it("wraps from enabled back to name", () => {
      const { result } = renderHook(() => useSortFlag(defaultInput));
      act(() => result.current.cycleCategory());
      act(() => result.current.cycleCategory());
      act(() => result.current.cycleCategory());
      expect(result.current.category).toBe("name");
    });
  });
});
