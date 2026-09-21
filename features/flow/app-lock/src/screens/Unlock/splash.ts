export type SplashState = Readonly<{
  hasPassword: boolean;
  isAwaitingBiometrics: boolean;
}>;

// Stands in for the splash rather than asking for a password: while the prompt is up, and for a
// user protected by biometrics alone.
export function isShowingSplash({ hasPassword, isAwaitingBiometrics }: SplashState): boolean {
  return isAwaitingBiometrics || !hasPassword;
}

export type SplashRetryState = Readonly<{
  canRetryBiometrics: boolean;
  isAwaitingBiometrics: boolean;
}>;

// Only once the prompt has gone. While it is up the system dialog owns the screen, and at boot the
// bare mark is what keeps the handover from the launch screen invisible.
export function isOfferingBiometricsRetry({
  canRetryBiometrics,
  isAwaitingBiometrics,
}: SplashRetryState): boolean {
  return canRetryBiometrics && !isAwaitingBiometrics;
}
