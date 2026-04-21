import { renderHook } from "@testing-library/react";
import { FEATURE_FLAGS_INITIAL_STATE, FeatureIdSchema } from "@shared/feature-flags";
import type { FeatureId, PartialFeatures } from "@shared/feature-flags";
import { useFeatureFlagsState } from "../../../tools/feature-flags/hooks/useFeatureFlagsState";
import type { FeatureFlagsToolProps } from "../../../tools/feature-flags/types";

const { resolved } = FEATURE_FLAGS_INITIAL_STATE;

const defaultProps: FeatureFlagsToolProps = {
  resolved,
  overrides: {},
  setOverride: jest.fn(),
  clearOverride: jest.fn(),
  clearAllOverrides: jest.fn(),
};

const testFlagId: FeatureId = "mockFeature";

describe("useFeatureFlagsState", () => {
  it("returns all flag ids sorted alphabetically", () => {
    const { result } = renderHook(() => useFeatureFlagsState(defaultProps));
    expect(result.current.flagIds).toEqual([...FeatureIdSchema.options].sort());
  });

  it("getFlagDisplayState marks overridden flags", () => {
    const overrides: PartialFeatures = { mockFeature: { enabled: true } };
    const { result } = renderHook(() => useFeatureFlagsState({ ...defaultProps, overrides }));
    const state = result.current.getFlagDisplayState(testFlagId);
    expect(state.isOverridden).toBe(true);
    expect(state.override).toEqual({ enabled: true });
  });

  it("getFlagDisplayState marks non-overridden flags", () => {
    const { result } = renderHook(() => useFeatureFlagsState(defaultProps));
    const state = result.current.getFlagDisplayState(testFlagId);
    expect(state.isOverridden).toBe(false);
    expect(state.override).toBeUndefined();
  });

  it("includes remote and default values in display state when provided", () => {
    const remote: PartialFeatures = { mockFeature: { enabled: true } };
    const defaults: PartialFeatures = { mockFeature: { enabled: false } };
    const { result } = renderHook(() =>
      useFeatureFlagsState({ ...defaultProps, remote, defaults }),
    );
    const state = result.current.getFlagDisplayState(testFlagId);
    expect(state.remote).toEqual({ enabled: true });
    expect(state.default).toEqual({ enabled: false });
  });
});
