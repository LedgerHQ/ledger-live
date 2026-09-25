import { configureStore } from "@reduxjs/toolkit";
import {
  endDigitalWalletProvisioning,
  markAnalyticsMilestonesReported,
  markCardOnboardingCompleted,
  payCardOnboardingWidgetPersistedSelector,
  payCardOnboardingWidgetSlice,
  resetCardOnboardingCompleted,
  restorePayCardOnboardingWidget,
  setAnalyticsCardId,
  selectDigitalWalletProvisioningStartedAt,
  selectHasCompletedCardOnboarding,
  startDigitalWalletProvisioning,
} from "./index";

type RestorePayload = Parameters<typeof restorePayCardOnboardingWidget>[0];

const initialPersisted = {
  hasCompletedOnboarding: false,
  analyticsCardId: null,
  reportedAnalyticsMilestones: [],
};

function makeStore() {
  const store = configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });
  return {
    dispatch: store.dispatch,
    hasCompletedOnboarding: () => selectHasCompletedCardOnboarding(store.getState()),
    provisioningStartedAt: () => selectDigitalWalletProvisioningStartedAt(store.getState()),
    persisted: () => payCardOnboardingWidgetPersistedSelector(store.getState()),
  };
}

describe("payCardOnboardingWidgetSlice", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with the onboarding uncompleted", () => {
    expect(makeStore().hasCompletedOnboarding()).toBe(false);
    expect(makeStore().persisted()).toEqual(initialPersisted);
  });

  it("starts with no wallet provisioning pending", () => {
    expect(makeStore().provisioningStartedAt()).toBeNull();
  });

  it("startDigitalWalletProvisioning records when the holder came back from the wallet", () => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
    const store = makeStore();

    store.dispatch(startDigitalWalletProvisioning());

    expect(store.provisioningStartedAt()).toBe(1_700_000_000_000);
  });

  it("endDigitalWalletProvisioning clears the pending provisioning", () => {
    const store = makeStore();
    store.dispatch(startDigitalWalletProvisioning());

    store.dispatch(endDigitalWalletProvisioning());

    expect(store.provisioningStartedAt()).toBeNull();
  });

  it("keeps a pending provisioning out of what is persisted", () => {
    const store = makeStore();

    store.dispatch(startDigitalWalletProvisioning());

    expect(store.persisted()).toEqual(initialPersisted);
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
      ...initialPersisted,
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
    });
  });

  it("clears reported milestones when the card account changes", () => {
    const store = makeStore();
    store.dispatch(setAnalyticsCardId("card-1"));
    store.dispatch(markAnalyticsMilestonesReported(["card-claimed"]));
    store.dispatch(setAnalyticsCardId("card-2"));

    expect(store.persisted()).toEqual({
      ...initialPersisted,
      analyticsCardId: "card-2",
    });
  });
});
