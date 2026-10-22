import { OnboardingStep, RecoveryKeyStatus, type DeviceOnboardingState } from "./types";

const recoveryKeyBackupFinished = new Set<RecoveryKeyStatus>([
  RecoveryKeyStatus.None,
  RecoveryKeyStatus.Rejected,
  RecoveryKeyStatus.Ready,
]);

export function isRecoveryKeyBackupFinished(status: RecoveryKeyStatus | null): boolean {
  return status !== null && recoveryKeyBackupFinished.has(status);
}

const welcomeSteps = new Set<OnboardingStep>([
  OnboardingStep.WelcomeScreen1,
  OnboardingStep.WelcomeScreen2,
  OnboardingStep.WelcomeScreen3,
  OnboardingStep.WelcomeScreen4,
  OnboardingStep.WelcomeScreenReminder,
]);

const setupSteps = new Set<OnboardingStep>([
  OnboardingStep.ChooseName,
  OnboardingStep.Pin,
  OnboardingStep.SetupChoice,
  OnboardingStep.SetupChoiceRestore,
  OnboardingStep.NewDevice,
  OnboardingStep.NewDeviceConfirming,
  OnboardingStep.RestoreSeed,
  OnboardingStep.RecoverRestore,
  OnboardingStep.RestoreCharon,
]);

export function isWelcomeStep(step: OnboardingStep): boolean {
  return welcomeSteps.has(step);
}

export function isSetupStep(step: OnboardingStep): boolean {
  return setupSteps.has(step);
}

const recoveryKeyScreenSteps = new Set<OnboardingStep>([
  OnboardingStep.Ready,
  OnboardingStep.WelcomeScreen1,
]);

export function isOnRecoveryKeyScreen(state: DeviceOnboardingState): boolean {
  return (
    state.isOnboarded &&
    state.recoveryKeyStatus !== null &&
    recoveryKeyScreenSteps.has(state.currentOnboardingStep)
  );
}
