import storage from "LLM/storage";
import { getStoreValue, setStoreValue } from "~/store";

const STORE_ID = "app-lock";
const KEY = "install";

// A string, not a boolean: `getStoreValue` answers undefined for anything lodash calls empty, and
// `isEmpty(true)` is true.
const MARKER = "installed";

// Settings stand in for installs that predate this marker: an upgrading user has protection and no
// marker, and reading that as a reinstall would silently delete it. A fresh install has neither.
export async function hasKnownInstall(): Promise<boolean> {
  if ((await getStoreValue<string>(KEY, STORE_ID)) === MARKER) {
    return true;
  }

  return (await storage.get("settings")) !== undefined;
}

export async function writeInstallMarker(): Promise<void> {
  await setStoreValue(KEY, MARKER, STORE_ID);
}
