import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useProductTourEligibility } from "./useProductTourEligibility";

const withOnboarding = (completed: boolean) => (state: State) => ({
  ...state,
  settings: { ...state.settings, hasCompletedOnboarding: completed },
});

describe("useProductTourEligibility", () => {
  it("should return isProductTourEligible true when lwmProductTour is on and onboarding is complete", () => {
    const { result } = renderHook(() => useProductTourEligibility(), {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: true } },
        withOnboarding(true),
      ),
    });

    expect(result.current.isProductTourEligible).toBe(true);
  });

  it("should return false when lwmProductTour is off", () => {
    const { result } = renderHook(() => useProductTourEligibility(), {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: false } },
        withOnboarding(true),
      ),
    });

    expect(result.current.isProductTourEligible).toBe(false);
  });

  it("should return false when onboarding is not complete", () => {
    const { result } = renderHook(() => useProductTourEligibility(), {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: true } },
        withOnboarding(false),
      ),
    });

    expect(result.current.isProductTourEligible).toBe(false);
  });
});
