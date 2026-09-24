export type StoredProtection = Readonly<{
  hasStoredProtection: boolean;
  hasKnownInstall: boolean;
}>;

/**
 * iOS keeps keychain entries when an app is deleted, Android wipes them; app storage goes on both.
 * So protection the running install cannot account for outlived its data, and keeping it would hold
 * the owner out of an empty app. The caller decides what counts as known, and must read an upgrade
 * as such: protection predating this check is otherwise indistinguishable from a reinstall.
 */
export function isProtectionStale({
  hasStoredProtection,
  hasKnownInstall,
}: StoredProtection): boolean {
  return hasStoredProtection && !hasKnownInstall;
}
