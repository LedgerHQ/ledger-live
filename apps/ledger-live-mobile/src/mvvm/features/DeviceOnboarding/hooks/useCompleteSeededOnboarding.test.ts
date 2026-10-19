import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useCompleteSeededOnboarding } from "./useCompleteSeededOnboarding";

function renderComplete(wasReadOnlyAtEntry: boolean, settings: Partial<State["settings"]> = {}) {
  return renderHook(() => useCompleteSeededOnboarding(wasReadOnlyAtEntry), {
    overrideInitialState: (state: State) => ({
      ...state,
      settings: { ...state.settings, ...settings },
    }),
  });
}

describe("useCompleteSeededOnboarding", () => {
  it("should complete once and reset the post-onboarding redirect when entry was read-only", () => {
    const { result, store } = renderComplete(true, {
      readOnlyModeEnabled: true,
      hasCompletedOnboarding: false,
      hasBeenRedirectedToPostOnboarding: true,
      hasBeenUpsoldProtect: true,
      isReborn: true,
      onboardingHasDevice: null,
    });

    act(() => result.current());
    act(() => result.current());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(store.getState().settings.hasBeenUpsoldProtect).toBe(false);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(false);
    expect(store.getState().settings.isReborn).toBe(false);
    expect(store.getState().settings.onboardingHasDevice).toBe(true);
  });

  it("should leave the post-onboarding redirect untouched when the user was already onboarded", () => {
    const { result, store } = renderComplete(false, {
      readOnlyModeEnabled: false,
      hasCompletedOnboarding: true,
      hasBeenRedirectedToPostOnboarding: true,
    });

    act(() => result.current());

    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(false);
    expect(store.getState().settings.hasBeenRedirectedToPostOnboarding).toBe(true);
    expect(store.getState().settings.onboardingHasDevice).not.toBe(true);
  });
});
