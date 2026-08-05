/**
 * @jest-environment jsdom
 */
import { LEGACY_ONBOARDING_DATE } from "@ledgerhq/live-common/postOnboarding/logic/legacyOnboardingDate";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import createStore from "~/state-manager/configureStore";
import type { State } from "~/renderer/reducers";
import { INITIAL_STATE as settingsInitialState } from "~/renderer/reducers/settings";
import { backfillOnboardingDate } from "../backfillOnboardingDate";

function makeStore({
  hasCompletedOnboarding,
  onboardingDate,
}: {
  hasCompletedOnboarding: boolean;
  onboardingDate: string | null;
}) {
  return createStore({
    state: {
      settings: { ...settingsInitialState, hasCompletedOnboarding },
      postOnboarding: { ...postOnboardingInitialState, onboardingDate },
    } as State,
    fetchRemoteFlags: null,
  });
}

describe("backfillOnboardingDate", () => {
  it("should backfill onboardingDate for legacy users who completed onboarding", () => {
    const store = makeStore({ hasCompletedOnboarding: true, onboardingDate: null });

    backfillOnboardingDate(store);

    expect(store.getState().postOnboarding.onboardingDate).toBe(
      LEGACY_ONBOARDING_DATE.toISOString(),
    );
  });

  it("should not backfill when onboarding is not completed", () => {
    const store = makeStore({ hasCompletedOnboarding: false, onboardingDate: null });

    backfillOnboardingDate(store);

    expect(store.getState().postOnboarding.onboardingDate).toBe(null);
  });

  it("should not overwrite an existing onboardingDate", () => {
    const existingDate = "2024-03-04T05:06:07.000Z";
    const store = makeStore({ hasCompletedOnboarding: true, onboardingDate: existingDate });

    backfillOnboardingDate(store);

    expect(store.getState().postOnboarding.onboardingDate).toBe(existingDate);
  });
});
