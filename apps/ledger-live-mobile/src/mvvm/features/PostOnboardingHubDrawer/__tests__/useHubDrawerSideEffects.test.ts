import { renderHook } from "@tests/test-renderer";
import { useHubDrawerSideEffects } from "../hooks/useHubDrawerSideEffects";

describe("useHubDrawerSideEffects", () => {
  it("should not dispatch anything when drawer is closed", () => {
    const { store } = renderHook(
      () => useHubDrawerSideEffects({ isOpen: false, isActivationDrawerVisible: false }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: { ...state.settings, hasBeenRedirectedToPostOnboarding: false },
        }),
      },
    );
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(false);
    expect(store.getState().settings.isPostOnboardingFlow).toBe(false);
  });

  it("should flag the user as redirected to post-onboarding when drawer opens", () => {
    const { store } = renderHook(
      () => useHubDrawerSideEffects({ isOpen: true, isActivationDrawerVisible: false }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: { ...state.settings, hasBeenRedirectedToPostOnboarding: false },
        }),
      },
    );
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
    expect(store.getState().settings.isPostOnboardingFlow).toBe(false);
  });

  it("should flag the user as in post-onboarding flow when activation drawer is visible", () => {
    const { store } = renderHook(() =>
      useHubDrawerSideEffects({ isOpen: true, isActivationDrawerVisible: true }),
    );
    expect(store.getState().settings.isPostOnboardingFlow).toBe(true);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
  });
});
