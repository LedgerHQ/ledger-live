export type PasswordFieldFocusState = Readonly<{
  hasPassword: boolean;
  isAwaitingBiometrics: boolean;
  isAppActive: boolean;
}>;

// The lock mounts while the app is backgrounded or still starting, where focus cannot raise a
// keyboard: the field draws as focused and nothing opens, so it is asked for again once active.
export function shouldFocusPasswordField({
  hasPassword,
  isAwaitingBiometrics,
  isAppActive,
}: PasswordFieldFocusState): boolean {
  return hasPassword && !isAwaitingBiometrics && isAppActive;
}
