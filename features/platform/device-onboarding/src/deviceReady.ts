import { isOnRecoveryKeyScreen, isRecoveryKeyBackupFinished } from "./types.internals";
import {
  isRecoveryKeyBackupInProgress,
  OnboardingStep,
  RecoveryKeyStatus,
  type DeviceOnboardingState,
} from "./types";

/** The device reports a finished setup, Recovery Key backup included: the machine leaves the setup. */
export function reportsSetupDone(
  state: DeviceOnboardingState | null,
  recoveryKeyBackupOpen: boolean,
): boolean {
  if (state === null) return false;
  if (state.recoveryKeyStatus === RecoveryKeyStatus.Unknown && recoveryKeyBackupOpen) return false;
  if (isRecoveryKeyBackupInProgress(state.recoveryKeyStatus)) return false;
  return (
    state.currentOnboardingStep === OnboardingStep.Ready ||
    (isOnRecoveryKeyScreen(state) && isRecoveryKeyBackupFinished(state.recoveryKeyStatus))
  );
}
