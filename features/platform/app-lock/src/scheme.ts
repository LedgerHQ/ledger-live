export type AppLockScheme = "legacy" | "revamped";

export type ResolveAppLockSchemeInput = Readonly<{
  hasStoredVerifier: boolean;
  isRevampEnabled: boolean;
}>;

export function resolveAppLockScheme({
  hasStoredVerifier,
  isRevampEnabled,
}: ResolveAppLockSchemeInput): AppLockScheme {
  if (hasStoredVerifier) {
    return "revamped";
  }

  return isRevampEnabled ? "revamped" : "legacy";
}
