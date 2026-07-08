import { renderHook } from "tests/testSetup";
import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { useShouldUseAnalyticsOptInScreenV2 } from "../useShouldUseAnalyticsOptInScreenV2";

const buildFeatureFlagsState = (overrides: Record<string, unknown>) => ({
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: {
    ...FEATURE_FLAGS_INITIAL_STATE.overrides,
    ...overrides,
  },
  resolved: {
    ...FEATURE_FLAGS_DEFAULTS,
    ...overrides,
  },
});

describe("useShouldUseAnalyticsOptInScreenV2", () => {
  it("should return true for onboarding variant B when the v2 flag is enabled", () => {
    const { result } = renderHook(() => useShouldUseAnalyticsOptInScreenV2(EntryPoint.onboarding), {
      initialState: {
        featureFlags: buildFeatureFlagsState({
          lldAnalyticsOptInPrompt: {
            enabled: true,
            params: { variant: "B", entryPoints: ["Onboarding"] },
          },
          lwdAnalyticsOptInScreenV2: { enabled: true },
        }),
      },
    });

    expect(result.current).toBe(true);
  });

  it("should return false for portfolio even when variant B and v2 flag are enabled", () => {
    const { result } = renderHook(() => useShouldUseAnalyticsOptInScreenV2(EntryPoint.portfolio), {
      initialState: {
        featureFlags: buildFeatureFlagsState({
          lldAnalyticsOptInPrompt: {
            enabled: true,
            params: { variant: "B", entryPoints: ["Portfolio"] },
          },
          lwdAnalyticsOptInScreenV2: { enabled: true },
        }),
      },
    });

    expect(result.current).toBe(false);
  });

  it("should return false for onboarding variant B when the v2 flag is disabled", () => {
    const { result } = renderHook(() => useShouldUseAnalyticsOptInScreenV2(EntryPoint.onboarding), {
      initialState: {
        featureFlags: buildFeatureFlagsState({
          lldAnalyticsOptInPrompt: {
            enabled: true,
            params: { variant: "B", entryPoints: ["Onboarding"] },
          },
          lwdAnalyticsOptInScreenV2: { enabled: false },
        }),
      },
    });

    expect(result.current).toBe(false);
  });

  it("should return false for onboarding variant A even when the v2 flag is enabled", () => {
    const { result } = renderHook(() => useShouldUseAnalyticsOptInScreenV2(EntryPoint.onboarding), {
      initialState: {
        featureFlags: buildFeatureFlagsState({
          lldAnalyticsOptInPrompt: {
            enabled: true,
            params: { variant: "A", entryPoints: ["Onboarding"] },
          },
          lwdAnalyticsOptInScreenV2: { enabled: true },
        }),
      },
    });

    expect(result.current).toBe(false);
  });

  it("should return false for onboarding variant B when lldAnalyticsOptInPrompt is disabled", () => {
    const { result } = renderHook(() => useShouldUseAnalyticsOptInScreenV2(EntryPoint.onboarding), {
      initialState: {
        featureFlags: buildFeatureFlagsState({
          lldAnalyticsOptInPrompt: {
            enabled: false,
            params: { variant: "B", entryPoints: ["Onboarding"] },
          },
          lwdAnalyticsOptInScreenV2: { enabled: true },
        }),
      },
    });

    expect(result.current).toBe(false);
  });
});
