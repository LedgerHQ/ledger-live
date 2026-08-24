export type StoredProtection = Readonly<{
  hasStoredProtection: boolean;
  hasInstallMarker: boolean;
}>;

// iOS keeps keychain items when an app is deleted, Android wipes them; the marker lives in app
// storage, which an uninstall clears on both.
export function isProtectionStale({
  hasStoredProtection,
  hasInstallMarker,
}: StoredProtection): boolean {
  return hasStoredProtection && !hasInstallMarker;
}
