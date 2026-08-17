export type AppLockScheme = "revamped" | "legacy";

// A stored verifier keeps the revamped path even if the flag goes off: the legacy screens
// cannot remove it, so ignoring it would trap the user with protection they cannot manage.
export function resolveAppLockScheme({
  hasStoredVerifier,
  isRevampEnabled,
}: Readonly<{ hasStoredVerifier: boolean; isRevampEnabled: boolean }>): AppLockScheme {
  return hasStoredVerifier || isRevampEnabled ? "revamped" : "legacy";
}
