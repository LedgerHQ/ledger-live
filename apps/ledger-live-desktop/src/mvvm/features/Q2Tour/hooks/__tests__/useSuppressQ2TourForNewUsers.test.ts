import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useSuppressQ2TourForNewUsers } from "../useSuppressQ2TourForNewUsers";

const q2TourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { q2Tour: true },
  },
};

const getInitialState = (overrides?: {
  loaded?: boolean;
  hasSeenQ2Tour?: boolean;
  hasCompletedOnboarding?: boolean;
  featureFlagOverrides?: typeof q2TourEnabledOverrides;
}) => ({
  ...withFlagOverrides(overrides?.featureFlagOverrides ?? q2TourEnabledOverrides),
  settings: {
    loaded: overrides?.loaded ?? true,
    hasCompletedOnboarding: overrides?.hasCompletedOnboarding ?? false,
    hasSeenQ2Tour: overrides?.hasSeenQ2Tour ?? false,
  },
});

describe("useSuppressQ2TourForNewUsers", () => {
  it("marks the tour as seen when settings load, tour is enabled, and user is not onboarded", () => {
    const { store } = renderHook(() => useSuppressQ2TourForNewUsers(), {
      initialState: getInitialState(),
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(true);
  });

  it("does nothing when the tour feature is disabled", () => {
    const { store } = renderHook(() => useSuppressQ2TourForNewUsers(), {
      initialState: getInitialState({
        featureFlagOverrides: { lwdWallet40: { enabled: true, params: { q2Tour: false } } },
      }),
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(false);
  });

  it("does nothing for an already-onboarded user", () => {
    const { store } = renderHook(() => useSuppressQ2TourForNewUsers(), {
      initialState: getInitialState({ hasCompletedOnboarding: true }),
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(false);
  });

  it("does nothing until settings are loaded", () => {
    const { store } = renderHook(() => useSuppressQ2TourForNewUsers(), {
      initialState: getInitialState({ loaded: false }),
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(false);
  });
});
