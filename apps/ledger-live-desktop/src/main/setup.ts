import { setEnvUnsafe } from "@shared/env";
import "./env";
import "./live-common-setup-main";
import "./bootstrap";
import "./saveHandlers";
import { app, clipboard, ipcMain, powerSaveBlocker, shell } from "electron";
import contextMenu from "electron-context-menu";
import updater from "./updater";
import { openURL } from "./openURL";

for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

ipcMain.on("updater", (e, type) => {
  updater(type);
});

ipcMain.handle("openUserDataDirectory", () => shell.openPath(app.getPath("userData")));

// openURL validates the scheme; do not swap it for shell.openExternal.
ipcMain.on("shell:open-external", (_event, url: string) => openURL(url));

ipcMain.handle("clipboard:matches-text", (_event, expected: string) => {
  try {
    return clipboard.readText() === expected;
  } catch {
    return null;
  }
});

ipcMain.handle("activate-keep-screen-awake", () => {
  return powerSaveBlocker.start("prevent-display-sleep");
});

ipcMain.handle("deactivate-keep-screen-awake", (_ev, id?: number) => {
  if (id !== undefined && !Number.isNaN(id)) {
    powerSaveBlocker.stop(id as number);
  }
});

process.setMaxListeners(0);

// In production mode, we do not want Electron's default GUI to show the error. Instead we will output to the console.
if (!__DEV__) {
  process.on("uncaughtException", function (error) {
    const stack = error.stack ? error.stack : `${error.name}: ${error.message}`;
    const message = "Uncaught Exception:\n" + stack;
    console.error(message);
  });
}

contextMenu({
  showInspectElement: __DEV__,
  showCopyImageAddress: false,
  // TODO: i18n for labels
  labels: {
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    copyLink: "Copy Link",
    inspect: "Inspect element",
  },
});
