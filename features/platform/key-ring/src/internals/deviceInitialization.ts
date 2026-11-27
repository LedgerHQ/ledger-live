import type { KeyRingDeviceInitialization, KeyRingDeviceRequirement } from "../types";

/** The device initialization of `requirement`: an app to open, or an OS feature to report. */
export function initializationOf(
  requirement: KeyRingDeviceRequirement,
): KeyRingDeviceInitialization {
  if (requirement.kind === "app") {
    return { kind: "app", appRequest: { appName: requirement.appName } };
  }
  return {
    kind: "os-feature",
    feature: requirement.feature,
    minimumOsVersion: requirement.minimumOsVersion,
  };
}
