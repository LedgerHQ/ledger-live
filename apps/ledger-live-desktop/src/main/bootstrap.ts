import os from "os";
import { app, ipcMain } from "electron";
import Store from "electron-store";
import { CHANNELS, type Bootstrap } from "~/bridge/contract";
import { getDistributionChannel } from "~/helpers/distributionChannel";

let store: Store | undefined;

/**
 * Deliberately not constructed at module scope: `src/main/index.ts` imports this before it
 * calls `setUserDataPath()`, so an eager `new Store()` would resolve `userData` to the
 * default Electron location and silently create a second, empty store — losing the user's
 * Recover subscription state.
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
    distributionChannel: getDistributionChannel(),
    store: getStore().store as Record<string, unknown>,
  };
}

// `sendSync`, because the renderer reads these at module-evaluation time. Not an extra
// blocking round trip on balance: it replaces the one `electron-store` used to make from
// the renderer.
ipcMain.on(CHANNELS.bootstrap, event => {
  event.returnValue = buildBootstrap();
});

// Fire-and-forget: the renderer updates its own copy at the same time, so it never waits
// for the disk.
ipcMain.on(CHANNELS.storeSet, (_event, key: string, value: unknown) => {
  getStore().set(key, value);
});

ipcMain.on(CHANNELS.storeClear, () => {
  getStore().clear();
});
