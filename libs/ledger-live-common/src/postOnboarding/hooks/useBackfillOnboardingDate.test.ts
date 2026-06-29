/**
 * @jest-environment jsdom
 */
import { createElement, type ComponentType, type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { configureStore, type EnhancedStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import type { PostOnboardingState } from "@ledgerhq/types-live";
import postOnboardingReducer, { initialState as postOnboardingInitialState } from "../reducer";
import { useBackfillOnboardingDate } from "./useBackfillOnboardingDate";

type BackfillTestState = { postOnboarding: PostOnboardingState };
type BackfillTestStore = EnhancedStore<BackfillTestState>;

const TestReduxProvider = Provider as ComponentType<{
  store: BackfillTestStore;
  children?: ReactNode;
}>;

function createTestStore(overrides: Partial<PostOnboardingState> = {}): BackfillTestStore {
  const postOnboarding: PostOnboardingState = {
    ...postOnboardingInitialState,
    ...overrides,
  };
  return configureStore({
    reducer: { postOnboarding: postOnboardingReducer as never },
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    preloadedState: { postOnboarding },
  }) as BackfillTestStore;
}

function renderBackfillHook(store: BackfillTestStore, isOnboardingDone: boolean) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(TestReduxProvider, { store }, children);
  return renderHook(({ done }: { done: boolean }) => useBackfillOnboardingDate(done), {
    wrapper,
    initialProps: { done: isOnboardingDone },
  });
}

describe("useBackfillOnboardingDate", () => {
  it("writes today (as an ISO string) when onboarding is done and no date is stored", async () => {
    const store = createTestStore({ onboardingDate: null });
    renderBackfillHook(store, true);
    await waitFor(() => {
      expect(store.getState().postOnboarding.onboardingDate).not.toBe(null);
    });
    expect(typeof store.getState().postOnboarding.onboardingDate).toBe("string");
  });

  it("does not write when onboarding is not done", () => {
    const store = createTestStore({ onboardingDate: null });
    renderBackfillHook(store, false);
    expect(store.getState().postOnboarding.onboardingDate).toBe(null);
  });

  it("never overwrites an existing date", () => {
    const existing = new Date("2020-01-20").toISOString();
    const store = createTestStore({ onboardingDate: existing });
    renderBackfillHook(store, true);
    expect(store.getState().postOnboarding.onboardingDate).toBe(existing);
  });
});
