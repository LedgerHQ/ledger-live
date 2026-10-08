import { app, clipboard, ipcMain, powerSaveBlocker, shell } from "electron";
import { CHANNELS } from "~/bridge/contract";
import { openURL } from "./openURL";
import updater from "./updater";

ipcMain.on(CHANNELS.updater, (_event, type) => {
  updater(type);
});

ipcMain.handle(CHANNELS.openUserDataDirectory, () => shell.openPath(app.getPath("userData")));

// openURL validates the scheme; do not swap it for shell.openExternal.
ipcMain.on(CHANNELS.openExternal, (_event, url: string) => openURL(url));

ipcMain.handle(CHANNELS.clipboardMatchesText, (_event, expected: string) => {
  try {
    return clipboard.readText() === expected;
  } catch {
    return null;
  }
});

ipcMain.handle(CHANNELS.keepScreenAwake, () => {
  return powerSaveBlocker.start("prevent-display-sleep");
});

ipcMain.handle(CHANNELS.releaseScreenAwake, (_ev, id?: number) => {
  if (id !== undefined && !Number.isNaN(id)) {
    powerSaveBlocker.stop(id);
  }
});
