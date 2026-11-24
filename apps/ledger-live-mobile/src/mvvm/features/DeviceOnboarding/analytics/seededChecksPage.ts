import { seededPages, type SeededPage } from "@features/platform-device-onboarding-analytics";
import { toChecksError, toChecksScreenState } from "../utils/checksPhase";

export function seededChecksPage(
  machineState: string | null,
  checksPaused: boolean,
  genuineFailureKind: string | null,
): SeededPage | null {
  const error = toChecksError(machineState, genuineFailureKind);
  if (error) {
    return error.kind === "declined"
      ? seededPages.genuineCheckRefused
      : seededPages.genuineCheckError;
  }
  switch (toChecksScreenState(machineState, checksPaused, true)) {
    case "idle":
      return seededPages.genuineCheck;
    case "awaitingAllow":
      return seededPages.genuineCheckStarted;
    case "updating":
      return seededPages.osUpdateRequired;
    case "succeeded":
      return seededPages.checksSuccess;
    case "checking":
      if (machineState?.startsWith("checks.genuineCheck")) return seededPages.genuineCheckStarted;
      if (machineState?.startsWith("checks.firmwareCheck")) return seededPages.checkOsVersion;
      return null;
    default:
      return null;
  }
}
