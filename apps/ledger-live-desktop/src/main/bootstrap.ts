import os from "os";
import { app, ipcMain } from "electron";
import Store from "electron-store";
import { CHANNELS, type Bootstrap } from "~/bridge/contract";
import { getDistributionChannel } from "~/helpers/distributionChannel";

/**
 * Builds the snapshot the preload hands to the renderer.
 *
 * Registered synchronously via `sendSync` because the renderer needs these values at
 * module-evaluation time. This is not an extra blocking round trip on balance: it replaces
 * the one `electron-store` already performed from the renderer (`electron-store-get-data`).
 */

let store: Store | undefined;

/**
 * The `lld.json` store, created on first use.
 *
 * Deliberately NOT constructed at module scope: this module is imported from
 * `src/main/setup.ts`, which `src/main/index.ts` imports before it calls
 * `setUserDataPath()`. Constructing eagerly would resolve `userData` to the default
 * Electron location and silently create a second, empty store, losing the user's Recover
 * subscription state.
 */
function getStore(): Store {
  if (!store) {
    store = new Store({ name: "lld", encryptionKey: "this_only_obfuscates" });
  }
  return store;
}

export function buildBootstrap(): Bootstrap {
  return {
    version: 1,
    env: { ...process.env },
    os: {
      type: os.type(),
      release: os.release(),
      platform: os.platform(),
      hostname: os.hostname(),
    },
    paths: {
      userData: app.getPath("userData"),
      home: app.getPath("home"),
    },
    appDirname: app.dirname || "",
    distributionChannel: getDistributionChannel(),
    locale: {
      app: app.getLocale(),
      system: app.getSystemLocale(),
    },
    store: getStore().store as Record<string, unknown>,
  };
}

// Registered at module scope rather than inside `app.on("ready")`: the preload only runs
// when the window loads a URL, which is later, but relying on that ordering would be a trap
// for anyone reorganising startup. The handler body is lazy, so `app.dirname` and
// `app.getPath` are resolved at call time.
ipcMain.on(CHANNELS.bootstrap, event => {
  event.returnValue = buildBootstrap();
});

// Write-through for the store hydrated into the bootstrap snapshot. Fire-and-forget: the
// renderer updates its own copy at the same time, so it never needs to wait for the disk.
ipcMain.on(CHANNELS.storeSet, (_event, key: string, value: unknown) => {
  getStore().set(key, value);
});

ipcMain.on(CHANNELS.storeClear, () => {
  getStore().clear();
});
