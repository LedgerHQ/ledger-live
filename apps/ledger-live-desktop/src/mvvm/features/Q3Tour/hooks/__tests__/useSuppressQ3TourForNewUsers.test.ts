import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useSuppressQ3TourForNewUsers } from "../useSuppressQ3TourForNewUsers";

const q3TourEnabledOverrides = {
  releaseTour: {
    enabled: true,
    params: { variant: "q3_a" as const },
  },
};

const getInitialState = (overrides?: {
  loaded?: boolean;
  hasSeenQ3Tour?: boolean;
  hasCompletedOnboarding?: boolean;
  featureFlagOverrides?: typeof q3TourEnabledOverrides;
}) => ({
  ...withFlagOverrides(overrides?.featureFlagOverrides ?? q3TourEnabledOverrides),
  settings: {
    loaded: overrides?.loaded ?? true,
    hasCompletedOnboarding: overrides?.hasCompletedOnboarding ?? false,
    hasSeenQ3Tour: overrides?.hasSeenQ3Tour ?? false,
  },
});

describe("useSuppressQ3TourForNewUsers", () => {
  it("marks the tour as seen when settings load, tour is enabled, and user is not onboarded", () => {
    const { store } = renderHook(() => useSuppressQ3TourForNewUsers(), {
      initialState: getInitialState(),
    });

    expect(store.getState().settings.hasSeenQ3Tour).toBe(true);
  });

  it("does nothing when the tour feature is disabled", () => {
    const { store } = renderHook(() => useSuppressQ3TourForNewUsers(), {
      initialState: getInitialState({
        featureFlagOverrides: { releaseTour: { enabled: false, params: { variant: "q3_a" } } },
      }),
    });

    expect(store.getState().settings.hasSeenQ3Tour).toBe(false);
  });

  it("does nothing for an already-onboarded user", () => {
    const { store } = renderHook(() => useSuppressQ3TourForNewUsers(), {
      initialState: getInitialState({ hasCompletedOnboarding: true }),
    });

    expect(store.getState().settings.hasSeenQ3Tour).toBe(false);
  });

  it("does nothing until settings are loaded", () => {
    const { store } = renderHook(() => useSuppressQ3TourForNewUsers(), {
      initialState: getInitialState({ loaded: false }),
    });

    expect(store.getState().settings.hasSeenQ3Tour).toBe(false);
  });
});
