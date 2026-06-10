import { act, renderHook } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { ALL_FLAG_IDS } from "../constants";
import type { FeatureId, PartialFeatures } from "@shared/feature-flags";
import { useFeatureFlagsFilters } from "./useFeatureFlagsFilters";
import type { FeatureFlagsFiltersInput } from "./useFeatureFlagsFilters";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const defaultInput: FeatureFlagsFiltersInput = {
  resolved,
  overrides: {},
};

const testFlagId: FeatureId = "mockFeature";

describe("useFeatureFlagsFilters", () => {
  describe("search", () => {
    it("returns all flags when search is empty", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      expect(result.current.filteredFlagIds).toEqual([...ALL_FLAG_IDS]);
    });

    it("filters flags by search query", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      act(() => result.current.setSearch("mock"));
      expect(result.current.filteredFlagIds.every(id => id.toLowerCase().includes("mock"))).toBe(
        true,
      );
      expect(result.current.filteredFlagIds).toContain(testFlagId);
    });

    it("search is case-insensitive", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      act(() => result.current.setSearch("MOCK"));
      expect(result.current.filteredFlagIds).toContain(testFlagId);
    });

    it("returns empty array when search matches nothing", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      act(() => result.current.setSearch("zzz_no_match_xyz"));
      expect(result.current.filteredFlagIds).toEqual([]);
    });
  });

  describe("filter", () => {
    it("defaults to 'all'", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      expect(result.current.filter).toBe("all");
    });

    it("'enabled' returns only flags with enabled: true", () => {
      const resolvedWithEnabled: typeof resolved = { ...resolved, mockFeature: { enabled: true } };
      const { result } = renderHook(() =>
        useFeatureFlagsFilters({ ...defaultInput, resolved: resolvedWithEnabled }),
      );
      act(() => result.current.setFilter("enabled"));
      expect(result.current.filteredFlagIds).toContain(testFlagId);
      expect(result.current.filteredFlagIds.every(id => resolvedWithEnabled[id].enabled)).toBe(
        true,
      );
    });

    it("'disabled' returns only flags with enabled: false", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      act(() => result.current.setFilter("disabled"));
      expect(result.current.filteredFlagIds).toContain(testFlagId);
      expect(result.current.filteredFlagIds.every(id => !resolved[id].enabled)).toBe(true);
    });

    it("'overridden' returns only overridden flags", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { result } = renderHook(() => useFeatureFlagsFilters({ ...defaultInput, overrides }));
      act(() => result.current.setFilter("overridden"));
      expect(result.current.filteredFlagIds).toEqual([testFlagId]);
    });

    it("'overridden' returns empty when no overrides", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      act(() => result.current.setFilter("overridden"));
      expect(result.current.filteredFlagIds).toEqual([]);
    });
  });

  describe("counts", () => {
    it("'all' count equals the total number of flags", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      expect(result.current.counts.all).toBe(ALL_FLAG_IDS.length);
    });

    it("counts are independent of the selected filter", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { result } = renderHook(() => useFeatureFlagsFilters({ ...defaultInput, overrides }));
      const initialCounts = { ...result.current.counts };
      act(() => result.current.setFilter("overridden"));
      expect(result.current.counts).toEqual(initialCounts);
    });

    it("counts are independent of the search query", () => {
      const { result } = renderHook(() => useFeatureFlagsFilters(defaultInput));
      const initialCounts = { ...result.current.counts };
      act(() => result.current.setSearch("zzz_no_match_xyz"));
      expect(result.current.counts).toEqual(initialCounts);
    });

    it("'overridden' count reflects the number of overridden flags", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { result } = renderHook(() => useFeatureFlagsFilters({ ...defaultInput, overrides }));
      expect(result.current.counts.overridden).toBe(1);
    });
  });

  describe("search and filter combined", () => {
    it("applies both search and filter simultaneously", () => {
      const overrides: PartialFeatures = { mockFeature: { enabled: true } };
      const { result } = renderHook(() => useFeatureFlagsFilters({ ...defaultInput, overrides }));
      act(() => {
        result.current.setFilter("overridden");
        result.current.setSearch("mock");
      });
      expect(result.current.filteredFlagIds).toContain(testFlagId);
      expect(result.current.filteredFlagIds.every(id => id.toLowerCase().includes("mock"))).toBe(
        true,
      );
    });
  });
});
