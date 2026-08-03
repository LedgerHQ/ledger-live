import { getEnv, setEnvUnsafe } from "@shared/env";
import "./env";
import "./live-common-setup-main";
import "./bootstrap";
import { app, dialog, ipcMain, powerSaveBlocker, shell } from "electron";
import contextMenu from "electron-context-menu";
import fs from "fs/promises";
import updater from "./updater";
import { mergeAllLogsJSON } from "./mergeAllLogs";
import { InMemoryLogger } from "./logger";

/**
 * Sets env variables for the main process.
 *
 * The renderer seeds its own env independently; there is no IPC channel keeping the
 * two in sync. Main reads `process.env` directly because it needs these before the
 * renderer process is spawned.
 */
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

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
      } catch (e) {
        console.warn("Error while parsing logs from the renderer process", e);
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

/**
 * Dev-only: reads a per-environment dotenv file for the renderer's config-mismatch
 * diagnostic. These files exist only in a repo checkout, and the renderer has no
 * filesystem access of its own.
 *
 * The environment name is checked against a fixed list rather than interpolated
 * directly, so a compromised renderer cannot use this to read arbitrary files.
 */
const DOTENV_ENVIRONMENTS = new Set(["production", "staging", "testing", "development"]);

ipcMain.handle("read-dotenv-file", async (_event, environment: string) => {
  if (!__DEV__ || !DOTENV_ENVIRONMENTS.has(environment)) return null;
  try {
    return await fs.readFile(`./.env.${environment}`, "utf8");
  } catch {
    return null;
  }
});

/**
 * Local Live App manifests (Developer settings).
 *
 * The dialog and the file I/O are deliberately performed together here rather than
 * handing a filesystem path back to the renderer: the renderer only ever sees the file
 * contents it asked for, never a path it could reuse to read or write somewhere else.
 */
ipcMain.handle("read-local-manifest", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
  if (canceled || !filePaths.length) return null;
  try {
    return await fs.readFile(filePaths[0], "utf8");
  } catch (error) {
    console.warn("Could not read local manifest", error);
    return null;
  }
});

ipcMain.handle("write-local-manifest", async (_event, defaultName: string, contents: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Export Manifest",
    defaultPath: defaultName,
    buttonLabel: "Export",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (canceled || !filePath) return false;
  try {
    await fs.writeFile(filePath, contents, "utf8");
    return true;
  } catch (error) {
    console.warn("Could not write local manifest", error);
    return false;
  }
});

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

ipcMain.handle(
  "save-png",
  async (_event, dialogOptions: Electron.SaveDialogOptions, base64: string): Promise<boolean> => {
    try {
      if (base64) {
        const result = await dialog.showSaveDialog(dialogOptions);
        if (!result.canceled && result.filePath) {
          await fs.writeFile(result.filePath, Buffer.from(base64, "base64"));
          return true;
        }
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
