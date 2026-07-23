import { renderHook, act } from "jest/render.native";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import type { FeatureFlagsToolProps } from "../../types";
import { useFlagListViewModel } from "./useFlagListViewModel";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const baseProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  setAllOverrides: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

describe("useFlagListViewModel", () => {
  it("feeds the filtered ids into the sorted list", () => {
    const { result } = renderHook(() => useFlagListViewModel(baseProps));

    act(() => result.current.toolBarProps.setSearch("mockFeature"));

    expect(result.current.sortedFlagIds).toEqual(["mockFeature"]);
    expect(result.current.toolBarProps.filteredCount).toBe(1);
  });
});
