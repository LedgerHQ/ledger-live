export type AppLockScheme = "revamped" | "legacy";

// Any stored protection keeps the revamped path even if the flag goes off: the legacy screens can
// neither remove a verifier nor manage biometrics.
export function resolveAppLockScheme({
  hasStoredProtection,
  isRevampEnabled,
}: Readonly<{ hasStoredProtection: boolean; isRevampEnabled: boolean }>): AppLockScheme {
  return hasStoredProtection || isRevampEnabled ? "revamped" : "legacy";
}
