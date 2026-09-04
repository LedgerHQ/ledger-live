import { configureStore } from "@reduxjs/toolkit";
import {
  markCardOnboardingCompleted,
  payCardOnboardingWidgetInitialState,
  payCardOnboardingWidgetPersistedSelector,
  payCardOnboardingWidgetSlice,
  resetCardOnboardingCompleted,
  restorePayCardOnboardingWidget,
  selectHasCompletedCardOnboarding,
} from "./index";

type RestorePayload = Parameters<typeof restorePayCardOnboardingWidget>[0];

function makeStore() {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });
  return {
    dispatch: store.dispatch,
    hasCompletedOnboarding: () => selectHasCompletedCardOnboarding(store.getState()),
    persisted: () => payCardOnboardingWidgetPersistedSelector(store.getState()),
  };
}

describe("payCardOnboardingWidgetSlice", () => {
  it("starts with the onboarding uncompleted", () => {
    expect(makeStore().hasCompletedOnboarding()).toBe(false);
    expect(makeStore().persisted()).toEqual(payCardOnboardingWidgetInitialState);
  });

  it("markCardOnboardingCompleted completes the onboarding", () => {
    const store = makeStore();
    store.dispatch(markCardOnboardingCompleted());
    expect(store.hasCompletedOnboarding()).toBe(true);
  });

  it("resetCardOnboardingCompleted brings the onboarding back to uncompleted", () => {
    const store = makeStore();
    store.dispatch(markCardOnboardingCompleted());
    store.dispatch(resetCardOnboardingCompleted());
    expect(store.hasCompletedOnboarding()).toBe(false);
  });

  it("restorePayCardOnboardingWidget restores a persisted flag", () => {
    const store = makeStore();
    store.dispatch(restorePayCardOnboardingWidget({ hasCompletedOnboarding: true }));
    expect(store.hasCompletedOnboarding()).toBe(true);
  });

  it.each<[string, RestorePayload]>([
    ["an undefined payload", undefined],
    ["an empty payload", {}],
    ["a non-boolean flag", { hasCompletedOnboarding: "yes" } as unknown as RestorePayload],
  ])("restorePayCardOnboardingWidget keeps the current flag given %s", (_name, payload) => {
    const store = makeStore();
    store.dispatch(markCardOnboardingCompleted());
    store.dispatch(restorePayCardOnboardingWidget(payload));
    expect(store.hasCompletedOnboarding()).toBe(true);
  });

  it("exposes the flag to persist", () => {
    const store = makeStore();
    store.dispatch(markCardOnboardingCompleted());
    expect(store.persisted()).toEqual({ hasCompletedOnboarding: true });
  });
});
