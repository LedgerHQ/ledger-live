import storage from "LLM/storage";
import { getStoreValue, setStoreValue } from "~/store";

const STORE_ID = "app-lock";
const KEY = "install";

// A string, not a boolean: `getStoreValue` answers undefined for anything lodash calls empty, and
// `isEmpty(true)` is true.
const MARKER = "installed";

// A completed onboarding stands in for installs that predate this marker: an upgrading user has
// protection and no marker, and reading that as a reinstall would silently delete it.
//
// Their mere existence will not do. The app writes settings within a second of any launch — the OS
// theme alone is enough — so a fresh install reads its own footprint as history and keeps the
// protection an uninstall was meant to take away. Onboarding is the one thing a reinstalled user
// has not done yet at this point, whatever else has already been written.
export async function hasKnownInstall(): Promise<boolean> {
  if ((await getStoreValue<string>(KEY, STORE_ID)) === MARKER) {
    return true;
  }

  const settings = (await storage.get("settings")) as
    | Readonly<{ hasCompletedOnboarding?: boolean }>
    | undefined;

  return settings?.hasCompletedOnboarding === true;
}

export async function writeInstallMarker(): Promise<void> {
  await setStoreValue(KEY, MARKER, STORE_ID);
}
