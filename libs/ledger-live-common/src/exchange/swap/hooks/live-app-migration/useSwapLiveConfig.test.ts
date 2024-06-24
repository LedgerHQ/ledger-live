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
  const setupFeatureFlagsMock = (demoZeroConfig, demoOneConfig) => {
    useMockFeature.mockImplementation(flagName => {
      switch (flagName) {
        case "ptxSwapLiveAppDemoZero":
          return demoZeroConfig;
        case "ptxSwapLiveAppDemoOne":
          return demoOneConfig;
        default:
          return null;
      }
    });
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return null if both features have the same enabled state", () => {
    setupFeatureFlagsMock({ enabled: true }, { enabled: true });
    const { result } = renderHook(() => useSwapLiveConfig());

    expect(result.current).toBeNull();
  });

  it("should return null if both features are disabled", () => {
    setupFeatureFlagsMock({ enabled: false }, { enabled: false });
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toBeNull();
  });

  it("should return demoZero if only demoZero is enabled", () => {
    setupFeatureFlagsMock(
      {
        enabled: true,
        params: { manifest_id: "swap-live-app-demo-0" },
      },
      { enabled: false },
    );
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0" },
    });
  });

  it("should return demoOne if only demoOne is enabled", () => {
    setupFeatureFlagsMock(
      { enabled: false },
      {
        enabled: true,
        params: { manifest_id: "swap-live-app-demo-1" },
      },
    );
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-1" },
    });
  });
});
