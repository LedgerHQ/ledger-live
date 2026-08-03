import os from "os";
import { app, ipcMain } from "electron";
import Store from "electron-store";
import { CHANNELS, type Bootstrap } from "~/bridge/contract";
import { getDistributionChannel } from "~/helpers/distributionChannel";

let store: Store | undefined;

// Lazy: built before setUserDataPath(), it would open a second, empty store.
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

// Synchronous: the renderer reads these values at module evaluation.
ipcMain.on(CHANNELS.bootstrap, event => {
  event.returnValue = buildBootstrap();
});

ipcMain.on(CHANNELS.storeSet, (_event, key: string, value: unknown) => {
  getStore().set(key, value);
});

ipcMain.on(CHANNELS.storeClear, () => {
  getStore().clear();
});
