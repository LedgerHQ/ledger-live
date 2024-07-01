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
    flags: Partial<{ enabled: boolean; params: { manifest_id: string } }>[],
  ) => {
    const flagsKeys = [
      "ptxSwapLiveAppDemoZero",
      "ptxSwapLiveAppDemoOne",
      "ptxSwapLiveAppDemoThree",
    ];

    useMockFeature.mockImplementation(flagName => flags[flagsKeys.indexOf(flagName)] ?? null);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should highest priority flag if all features have the same enabled state", () => {
    setupFeatureFlagsMock([
      { enabled: true, params: { manifest_id: "demo_0" } },
      { enabled: true, params: { manifest_id: "demo_1" } },
      { enabled: true, params: { manifest_id: "demo_3" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());

    expect(result.current).not.toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.current?.params as any)?.manifest_id).toEqual("demo_3");
  });

  it("should return null if both features are disabled", () => {
    setupFeatureFlagsMock([{ enabled: false }, { enabled: false }, { enabled: false }]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toBeNull();
  });

  it("should return demoZero if only demoZero is enabled", () => {
    setupFeatureFlagsMock([
      {
        enabled: true,
        params: { manifest_id: "swap-live-app-demo-0" },
      },
      { enabled: false },
      { enabled: false },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0" },
    });
  });

  it("should return demoOne if only demoOne is enabled", () => {
    setupFeatureFlagsMock([
      { enabled: false },
      {
        enabled: true,
        params: { manifest_id: "swap-live-app-demo-1" },
      },
      { enabled: false },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-1" },
    });
  });

  it("should return demoThree if only demoOne is enabled", () => {
    setupFeatureFlagsMock([
      { enabled: false },
      {
        enabled: true,
        params: { manifest_id: "swap-live-app-demo-3" },
      },
      { enabled: false },
    ]);

    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-3" },
    });
  });
});
