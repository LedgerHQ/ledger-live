import { getStoreValue, setStoreValue } from "~/store";

const STORE_ID = "app-lock";
const KEY = "install";

// A string, not a boolean: `getStoreValue` answers undefined for anything lodash calls empty, and
// `isEmpty(true)` is true.
const MARKER = "installed";

export async function hasInstallMarker(): Promise<boolean> {
  return (await getStoreValue<string>(KEY, STORE_ID)) === MARKER;
}

export async function writeInstallMarker(): Promise<void> {
  await setStoreValue(KEY, MARKER, STORE_ID);
}
