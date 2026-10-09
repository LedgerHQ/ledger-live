import fs from "fs";
import path from "path";

/**
 * The profile of a run on local nodes, next to the default one: `<userData>-local-node-<ids>`.
 *
 * Local-node accounts share their ids with the real ones (same currency, same addresses), so they
 * get a profile of their own and never mix with real accounts. One per set of local currencies, so
 * runs on different sets can be open side by side, as the single-instance lock is per profile.
 */
export function localNodeProfilePath(userData: string, currencies: readonly string[]): string {
  return `${userData}-local-node-${[...currencies].sort().join("-")}`;
}

/**
 * Starts a local-node profile with no app data: a local chain only lives until its `down`, so
 * accounts kept from a previous run would carry operations and heights of a chain that no longer
 * exists. Only to call once this process holds the profile's single-instance lock, so a second
 * launch never wipes the running app's data.
 */
export function resetLocalNodeProfile(profilePath: string): void {
  if (!/-local-node-[^/\\]+$/.test(profilePath)) {
    throw new Error(`Not a local node profile: ${profilePath}`);
  }
  fs.rmSync(path.join(profilePath, "app.json"), { force: true });
}
