export type SplashState = Readonly<{
  hasPassword: boolean;
  isAwaitingBiometrics: boolean;
}>;

// Exported because the container needs it too: the mark is drawn at the splash's size in this state.
export function isShowingSplash({ hasPassword, isAwaitingBiometrics }: SplashState): boolean {
  return isAwaitingBiometrics || !hasPassword;
}
