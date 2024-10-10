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
    const flagsKeys = [
      "ptxSwapLiveAppDemoZero",
      "ptxSwapLiveAppDemoOne",
      "ptxSwapLiveAppDemoThree",
      "ptxSwapCoreExperiment",
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
    expect((result.current?.params as any)?.manifest_id).toEqual("demo_0");
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

  it("should return config when ptxSwapCoreExperiment has valid variant Demo0", () => {
    const expected = {
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0", variant: "Demo0" },
    };
    setupFeatureFlagsMock([{ enabled: false }, { enabled: false }, { enabled: false }, expected]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual(expected);
  });

  it("should return config when ptxSwapCoreExperiment has valid variant Demo3", () => {
    setupFeatureFlagsMock([
      { enabled: false },
      { enabled: false },
      { enabled: false },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3", variant: "Demo3" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-3", variant: "Demo3" },
    });
  });

  it("should return config when ptxSwapCoreExperiment has valid variant Demo3Thorswap", () => {
    setupFeatureFlagsMock([
      { enabled: false },
      { enabled: false },
      { enabled: false },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3", variant: "Demo3Thorswap" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-3", variant: "Demo3Thorswap" },
    });
  });

  it("should return demoZero if demoThree and  are enabled", () => {
    setupFeatureFlagsMock([
      { enabled: true, params: { manifest_id: "swap-live-app-demo-0" } },
      { enabled: false },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0" },
    });
  });

  it("should return demoZero if all demo flags are enabled", () => {
    setupFeatureFlagsMock([
      { enabled: true, params: { manifest_id: "swap-live-app-demo-0" } },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-1" } },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0" },
    });
  });

  it("should prioritize demoZero over demo flags if all are enabled", () => {
    setupFeatureFlagsMock([
      { enabled: true, params: { manifest_id: "swap-live-app-demo-0" } },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-1" } },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3" } },
      { enabled: true, params: { manifest_id: "swap-live-app-demo-3", variant: "Demo3" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toEqual({
      enabled: true,
      params: { manifest_id: "swap-live-app-demo-0" },
    });
  });

  it("should return null when coreExperiment is enabled but has no variant", () => {
    setupFeatureFlagsMock([
      { enabled: false },
      { enabled: false },
      { enabled: false },
      { enabled: true, params: { manifest_id: "core-experiment" } },
    ]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toBeNull();
  });

  it("should return null when all flags are undefined", () => {
    setupFeatureFlagsMock([undefined, undefined, undefined, undefined]);
    const { result } = renderHook(() => useSwapLiveConfig());
    expect(result.current).toBeNull();
  });
});
