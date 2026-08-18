import { LEGACY_ONBOARDING_DATE } from "@ledgerhq/live-common/postOnboarding/logic/legacyOnboardingDate";
import { createStore } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { backfillOnboardingDate } from "../backfillOnboardingDate";

function makeStore({
  hasCompletedOnboarding,
  onboardingDate,
}: {
  hasCompletedOnboarding: boolean;
  onboardingDate: string | null;
}) {
  return createStore({
    overrideInitialState: (state: State) => ({
      ...state,
      settings: { ...state.settings, hasCompletedOnboarding },
      postOnboarding: { ...state.postOnboarding, onboardingDate },
    }),
  });
}

describe("backfillOnboardingDate", () => {
  it("should backfill onboardingDate for legacy users who completed onboarding", () => {
    const store = makeStore({ hasCompletedOnboarding: true, onboardingDate: null });
    const save = jest.fn().mockResolvedValue(undefined);
    const postOnboardingBefore = store.getState().postOnboarding;

    backfillOnboardingDate(store, { save });

    expect(store.getState().postOnboarding).toEqual({
      ...postOnboardingBefore,
      onboardingDate: LEGACY_ONBOARDING_DATE.toISOString(),
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("should not backfill when onboarding is not completed", () => {
    const store = makeStore({ hasCompletedOnboarding: false, onboardingDate: null });
    const save = jest.fn().mockResolvedValue(undefined);

    backfillOnboardingDate(store, { save });

    expect(store.getState().postOnboarding.onboardingDate).toBe(null);
    expect(save).not.toHaveBeenCalled();
  });

  it("should not overwrite an existing onboardingDate", () => {
    const existingDate = "2024-03-04T05:06:07.000Z";
    const store = makeStore({ hasCompletedOnboarding: true, onboardingDate: existingDate });
    const save = jest.fn().mockResolvedValue(undefined);

    backfillOnboardingDate(store, { save });

    expect(store.getState().postOnboarding.onboardingDate).toBe(existingDate);
    expect(save).not.toHaveBeenCalled();
  });
});
