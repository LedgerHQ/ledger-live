/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import * as featureFlags from "../featureFlags";
import { useLdmkFeatureFlagInitiallyEnabled } from "./useLdmkFeatureFlagInitiallyEnabled";

describe("useLdmkFeatureFlagInitiallyEnabled", () => {
  let useFeatureSpy: jest.SpyInstance;

  beforeEach(() => {
    useFeatureSpy = jest.spyOn(featureFlags, "useFeature").mockReturnValue({ enabled: true });
  });

  afterEach(() => {
    useFeatureSpy.mockRestore();
  });

  it("returns true if feature flag is enabled", () => {
    useFeatureSpy.mockReturnValue({ enabled: true });
    const { result } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());
    expect(result.current).toBe(true);
  });

  it("returns false if feature flag is disabled", () => {
    useFeatureSpy.mockReturnValue({ enabled: false });
    const { result } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());
    expect(result.current).toBe(false);
  });

  it("preserves the initial value even if the feature flag changes", () => {
    useFeatureSpy
      .mockReturnValueOnce({ enabled: false }) // first render
      .mockReturnValue({ enabled: true }); // subsequent renders
    const { result, rerender } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());

    expect(result.current).toBe(false); // initial value
    rerender();
    expect(result.current).toBe(false); // remains the same
  });
});
