/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import * as featureFlags from "../featureFlags";
import { useLdmkFeatureFlagInitiallyEnabled } from "./useLdmkFeatureFlagInitiallyEnabled";

jest.mock("../featureFlags", () => ({
  ...jest.requireActual("../featureFlags"),
  useFeature: jest.fn(),
}));

describe("useLdmkFeatureFlagInitiallyEnabled", () => {
  const mockedUseFeature = jest.mocked(featureFlags.useFeature);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFeature.mockReturnValue({ enabled: true });
  });

  it("returns true if feature flag is enabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: true });
    const { result } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());
    expect(result.current).toBe(true);
  });

  it("returns false if feature flag is disabled", () => {
    mockedUseFeature.mockReturnValue({ enabled: false });
    const { result } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());
    expect(result.current).toBe(false);
  });

  it("preserves the initial value even if the feature flag changes", () => {
    mockedUseFeature
      .mockReturnValueOnce({ enabled: false }) // first render
      .mockReturnValue({ enabled: true }); // subsequent renders
    const { result, rerender } = renderHook(() => useLdmkFeatureFlagInitiallyEnabled());

    expect(result.current).toBe(false); // initial value
    rerender();
    expect(result.current).toBe(false); // remains the same
  });
});
