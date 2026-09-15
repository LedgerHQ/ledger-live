import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useQ3TourDrawerViewModel } from "../useQ3TourDrawerViewModel";

const q3TourEnabledOverrides = {
  releaseTour: {
    enabled: true,
    params: { variant: "q3_a" as const },
  },
};

const getInitialState = (overrides?: {
  hasSeenQ3Tour?: boolean;
  hasCompletedOnboarding?: boolean;
  featureFlagOverrides?: typeof q3TourEnabledOverrides;
}) => ({
  ...withFlagOverrides(overrides?.featureFlagOverrides ?? q3TourEnabledOverrides),
  settings: {
    hasCompletedOnboarding: overrides?.hasCompletedOnboarding ?? true,
    hasSeenQ3Tour: overrides?.hasSeenQ3Tour ?? false,
  },
});

describe("useQ3TourDrawerViewModel", () => {
  describe("auto-open on Portfolio", () => {
    it("should not auto-open when not on Portfolio page", () => {
      const { result } = renderHook(() => useQ3TourDrawerViewModel({ isOnPortfolioPage: false }), {
        initialState: getInitialState(),
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should auto-open when tour is enabled, not seen, and onboarding is complete", () => {
      const { result } = renderHook(() => useQ3TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState(),
      });

      expect(result.current.isDialogOpen).toBe(true);
    });

    it("should not auto-open when tour has already been seen", () => {
      const { result } = renderHook(() => useQ3TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState({ hasSeenQ3Tour: true }),
      });

      expect(result.current.isDialogOpen).toBe(false);
    });

    it("should not auto-open when onboarding is incomplete", () => {
      const { result } = renderHook(() => useQ3TourDrawerViewModel({ isOnPortfolioPage: true }), {
        initialState: getInitialState({ hasCompletedOnboarding: false }),
      });

      expect(result.current.isDialogOpen).toBe(false);
    });
  });
});
