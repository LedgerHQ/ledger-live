import { configureStore } from "@reduxjs/toolkit";
import {
  markAnalyticsMilestonesReported,
  markCardAccountRead,
  markCardOnboardingCompleted,
  payCardOnboardingWidgetInitialState,
  payCardOnboardingWidgetPersistedSelector,
  payCardOnboardingWidgetSlice,
  resetCardOnboardingCompleted,
  restorePayCardOnboardingWidget,
  setAnalyticsCardId,
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

  it("restorePayCardOnboardingWidget restores the persisted flag", () => {
    const store = makeStore();
    store.dispatch(restorePayCardOnboardingWidget({ hasCompletedOnboarding: true }));
    expect(store.hasCompletedOnboarding()).toBe(true);
  });

  it("restorePayCardOnboardingWidget ignores a blob still carrying the retired wallet flag", () => {
    const store = makeStore();
    store.dispatch(
      restorePayCardOnboardingWidget({
        hasCompletedOnboarding: true,
        hasAddedCardToWallet: true,
      } as unknown as RestorePayload),
    );
    expect(store.persisted()).toEqual({
      ...payCardOnboardingWidgetInitialState,
      hasCompletedOnboarding: true,
    });
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
    store.dispatch(
      markAnalyticsMilestonesReported(["card-onboarding-in-progress", "card-onboarding-completed"]),
    );
    expect(store.persisted()).toEqual({
      hasCompletedOnboarding: true,
      analyticsCardId: null,
      reportedAnalyticsMilestones: ["card-onboarding-completed"],
      hasReadCardAccount: false,
    });
  });

  it("remembers a read account across restarts", () => {
    const store = makeStore();
    store.dispatch(markCardAccountRead());

    const restored = makeStore();
    restored.dispatch(restorePayCardOnboardingWidget(store.persisted()));

    expect(restored.persisted().hasReadCardAccount).toBe(true);
  });

  it("keeps the account read once its first card shows up", () => {
    const store = makeStore();
    store.dispatch(markCardAccountRead());
    store.dispatch(setAnalyticsCardId("card-1"));

    expect(store.persisted().hasReadCardAccount).toBe(true);
  });

  it("reads the account again when another account's card shows up", () => {
    const store = makeStore();
    store.dispatch(setAnalyticsCardId("card-1"));
    store.dispatch(markCardAccountRead());
    store.dispatch(setAnalyticsCardId("card-2"));

    expect(store.persisted().hasReadCardAccount).toBe(false);
  });

  it("clears reported milestones when the card account changes", () => {
    const store = makeStore();
    store.dispatch(setAnalyticsCardId("card-1"));
    store.dispatch(markAnalyticsMilestonesReported(["card-claimed"]));
    store.dispatch(setAnalyticsCardId("card-2"));

    expect(store.persisted()).toEqual({
      ...payCardOnboardingWidgetInitialState,
      analyticsCardId: "card-2",
    });
  });
});
