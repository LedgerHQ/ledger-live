import { selectFeature } from "@shared/feature-flags";
import { trackingEnabledSelector } from "../reducers/settings";
import type { State } from "../reducers";

export function shouldIncludeSegmentIdentity(state: State): boolean {
  const brazeOptOutIdentityCleanup = selectFeature(state, "brazeOptOutIdentityCleanup")?.enabled;
  if (!brazeOptOutIdentityCleanup) return true;
  return trackingEnabledSelector(state);
}
