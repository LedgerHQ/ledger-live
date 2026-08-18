export type PasswordFieldFocusState = Readonly<{
  hasPassword: boolean;
  isAwaitingBiometrics: boolean;
  isCovered: boolean;
  isAppActive: boolean;
}>;

// The lock is mounted on background, where focus cannot raise a keyboard, so it has to be asked for
// again once the app is back.
export function shouldFocusPasswordField({
  hasPassword,
  isAwaitingBiometrics,
  isCovered,
  isAppActive,
}: PasswordFieldFocusState): boolean {
  return hasPassword && !isAwaitingBiometrics && !isCovered && isAppActive;
}
