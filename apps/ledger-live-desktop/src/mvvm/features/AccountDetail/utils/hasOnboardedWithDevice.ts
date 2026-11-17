import type { State } from "~/renderer/reducers";
import {
  hasCompletedOnboardingSelector,
  hasOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";

export function hasOnboardedWithDeviceSelector(state: State): boolean {
  return hasCompletedOnboardingSelector(state) && hasOnboardedDeviceSelector(state);
}
