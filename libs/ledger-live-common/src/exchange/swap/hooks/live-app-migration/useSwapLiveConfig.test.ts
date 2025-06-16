/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useFeature } from "../../../../featureFlags";
import { useSwapLiveConfig } from "./useSwapLiveConfig";

// Explicitly mock the featureFlags module
jest.mock("../../../../featureFlags");

// Setup mock for useFeature to be recognized as a jest.Mock
const useMockFeature = useFeature as jest.Mock;

describe("useSwapLiveConfig", () => {
  // Setup the mock for useFeatureFlags to return an object with getFeature
  const setupFeatureFlagsMock = (
    flags: Partial<
      { enabled: boolean; params: { manifest_id: string; variant?: string } } | undefined
    >[],
  ) => {
    const flagsKeys = ["ptxSwapLiveApp"];

    useMockFeature.mockImplementation(flagName => flags[flagsKeys.indexOf(flagName)] ?? null);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return demoThree config", () => {
    setupFeatureFlagsMock([{ enabled: true, params: { manifest_id: "swap-live-app-demo-3" } }]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-3" },
    });
  });
});
