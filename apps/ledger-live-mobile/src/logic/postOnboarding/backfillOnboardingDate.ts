import type { Store } from "redux";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { LEGACY_ONBOARDING_DATE } from "@ledgerhq/live-common/postOnboarding/logic/legacyOnboardingDate";
import {
  onboardingDateSelector,
  postOnboardingSelector,
} from "@ledgerhq/live-common/postOnboarding/reducer";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { savePostOnboardingState } from "~/db";
import type { State } from "~/reducers/types";
import logger from "~/logger";

type BackfillDeps = {
  save?: typeof savePostOnboardingState;
};

/**
 * One-off migration run at store hydration: legacy users who completed onboarding
 * before `onboardingDate` existed have no date stored. Seed it once here so the app
 * starts with correct state and components only read it. Never overwrite an existing
 * date (new onboardings set the real completion date via POST_ONBOARDING_INIT).
 */
export function backfillOnboardingDate(
  store: Store<State>,
  { save = savePostOnboardingState }: BackfillDeps = {},
): void {
  const state = store.getState();
  if (hasCompletedOnboardingSelector(state) && onboardingDateSelector(state) == null) {
    store.dispatch(setPostOnboardingDate({ onboardingDate: LEGACY_ONBOARDING_DATE }));
    // Persist immediately because DBSave baselines after this migration runs.
    save(postOnboardingSelector(store.getState())).catch(error => logger.critical(error));
  }
}
