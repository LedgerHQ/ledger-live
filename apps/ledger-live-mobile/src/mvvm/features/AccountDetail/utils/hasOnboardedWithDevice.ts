import type { State } from "~/reducers/types";
import {
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
  seenDevicesSelector,
} from "~/reducers/settings";

export function hasOnboardedWithDeviceSelector(state: State): boolean {
  const hasUsedDevice =
    seenDevicesSelector(state).length > 0 || lastConnectedDeviceSelector(state) !== null;
  return hasCompletedOnboardingSelector(state) && hasUsedDevice;
}
