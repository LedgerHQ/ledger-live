export type SplashState = Readonly<{
  hasPassword: boolean;
  isAwaitingBiometrics: boolean;
}>;

// Stands in for the splash rather than asking for a password: while the prompt is up, and for a
// user protected by biometrics alone.
export function isShowingSplash({ hasPassword, isAwaitingBiometrics }: SplashState): boolean {
  return isAwaitingBiometrics || !hasPassword;
}
