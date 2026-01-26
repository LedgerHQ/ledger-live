import "./env";
import "~/live-common-setup-base";
import { captureException } from "~/sentry/main";
import { app, ipcMain, powerSaveBlocker, shell } from "electron";
import contextMenu from "electron-context-menu";
import fs from "fs/promises";
import updater from "./updater";
import { mergeAllLogsJSON } from "./mergeAllLogs";
import { InMemoryLogger } from "./logger";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";

/**
 * Sets env variables for the main process.
 *
 * The renderer process will also set some env variables via the `setEnv` IPC channel
 * but we might need some envs before the renderer process is spawned.
 */
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

ipcMain.on("mainCrashTest", () => {
  captureException(new Error("CrashTestMain"));
});

ipcMain.on("updater", (e, type) => {
  updater(type);
});

/**
 * Saves logs from the renderer process to a file.
 */
ipcMain.handle(
  "save-logs",
  async (_event, path: Electron.SaveDialogReturnValue, rendererLogsStr: string) => {
    if (!path.canceled && path.filePath) {
      const inMemoryLogger = InMemoryLogger.getLogger();
      const internalLogsChronological = inMemoryLogger.getLogs().reverse(); // The logs are in reverse order.

      // The deserialization would have been done internally by electron if `rendererLogs` was passed directly as a JS object/array.
      // But it avoids certain issues with the serialization/deserialization done by electron.
      let rendererLogsChronological: Array<{ timestamp: string }> = [];
      try {
        rendererLogsChronological = JSON.parse(rendererLogsStr).reverse(); // The logs are in reverse order.
      } catch (error) {
        console.error("Error while parsing logs from the renderer process", error);
        return;
      }

      fs.writeFile(
        path.filePath,
        mergeAllLogsJSON(
          rendererLogsChronological,
          internalLogsChronological,
          getEnv("EXPORT_MAX_LOGS"),
        ),
      );
    } else {
      console.warn("No path given to save logs");
    }
  },
);

ipcMain.handle("openUserDataDirectory", () => shell.openPath(app.getPath("userData")));

ipcMain.handle("getPathUserData", () => app.getPath("userData"));

ipcMain.handle("getPathHome", () => app.getPath("home"));

ipcMain.handle(
  "export-operations",
  async (
    event,
    path: {
      canceled: boolean;
      filePath: string;
    },
    csv: string,
  ): Promise<boolean> => {
    try {
      if (!path.canceled && path.filePath && csv) {
        await fs.writeFile(path.filePath, csv);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  },
);

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
