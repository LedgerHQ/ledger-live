import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import type { ReduxStore } from "~/state-manager/configureStore";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

/**
 * One-off migration run at store hydration: legacy users who completed onboarding
 * before `onboardingDate` existed have no date stored. Seed it once here so the app
 * starts with correct state and components only read it. Never overwrite an existing
 * date (new onboardings set the real completion date via POST_ONBOARDING_INIT).
 *
 * The DB middleware persists post-onboarding actions automatically.
 */
export function backfillOnboardingDate(store: ReduxStore, now: Date = new Date()): void {
  const state = store.getState();
  if (hasCompletedOnboardingSelector(state) && onboardingDateSelector(state) == null) {
    store.dispatch(setPostOnboardingDate({ onboardingDate: now }));
  }
}
