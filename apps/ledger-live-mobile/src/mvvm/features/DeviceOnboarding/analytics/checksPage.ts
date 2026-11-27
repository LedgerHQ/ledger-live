import {
  onboardingPages,
  type OnboardingPage,
} from "@features/platform-device-onboarding-analytics";
import { toChecksError, toChecksScreenState } from "../utils/checksPhase";

export function checksPage(
  machineState: string | null,
  checksPaused: boolean,
  genuineFailureKind: string | null,
): OnboardingPage | null {
  const error = toChecksError(machineState, genuineFailureKind);
  if (error) {
    return error.kind === "declined"
      ? onboardingPages.genuineCheckRefused
      : onboardingPages.genuineCheckError;
  }
  switch (toChecksScreenState(machineState, checksPaused, true)) {
    case "idle":
      return onboardingPages.genuineCheck;
    case "awaitingAllow":
      return onboardingPages.genuineCheckStarted;
    case "updating":
      return onboardingPages.osUpdateRequired;
    case "succeeded":
      return onboardingPages.checksSuccess;
    case "checking":
      if (machineState?.startsWith("checks.genuineCheck"))
        return onboardingPages.genuineCheckStarted;
      if (machineState?.startsWith("checks.firmwareCheck")) return onboardingPages.checkOsVersion;
      return null;
    default:
      return null;
  }
}
