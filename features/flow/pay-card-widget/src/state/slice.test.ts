import { configureStore } from "@reduxjs/toolkit";
import {
  markCardAddedToWallet,
  markCardOnboardingCompleted,
  payCardOnboardingWidgetInitialState,
  payCardOnboardingWidgetPersistedSelector,
  payCardOnboardingWidgetSlice,
  resetCardOnboardingCompleted,
  restorePayCardOnboardingWidget,
  selectHasAddedCardToWallet,
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
    hasAddedCardToWallet: () => selectHasAddedCardToWallet(store.getState()),
    persisted: () => payCardOnboardingWidgetPersistedSelector(store.getState()),
  };
}

describe("payCardOnboardingWidgetSlice", () => {
  it("starts with the onboarding uncompleted and the card outside the wallet", () => {
    expect(makeStore().hasCompletedOnboarding()).toBe(false);
    expect(makeStore().hasAddedCardToWallet()).toBe(false);
    expect(makeStore().persisted()).toEqual(payCardOnboardingWidgetInitialState);
  });

  it("markCardAddedToWallet marks the wallet step done", () => {
    const store = makeStore();
    store.dispatch(markCardAddedToWallet());
    expect(store.hasAddedCardToWallet()).toBe(true);
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

  it("restorePayCardOnboardingWidget restores the persisted flags", () => {
    const store = makeStore();
    store.dispatch(
      restorePayCardOnboardingWidget({ hasCompletedOnboarding: true, hasAddedCardToWallet: true }),
    );
    expect(store.hasCompletedOnboarding()).toBe(true);
    expect(store.hasAddedCardToWallet()).toBe(true);
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

  it("exposes the flags to persist", () => {
    const store = makeStore();
    store.dispatch(markCardOnboardingCompleted());
    store.dispatch(markCardAddedToWallet());
    expect(store.persisted()).toEqual({
      hasCompletedOnboarding: true,
      hasAddedCardToWallet: true,
    });
  });
});
