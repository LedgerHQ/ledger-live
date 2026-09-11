import { getEnv, setEnvUnsafe } from "@shared/env";
import "./env";
import "./live-common-setup-main";
import "./bootstrap";
import { app, clipboard, dialog, ipcMain, powerSaveBlocker, shell } from "electron";
import contextMenu from "electron-context-menu";
import fs from "fs/promises";
import updater from "./updater";
import { mergeAllLogsJSON } from "./mergeAllLogs";
import { InMemoryLogger } from "./logger";
import { openURL } from "./openURL";
import type { SaveOutcome, SaveRequest } from "~/bridge/contract";

// The renderer seeds its own env independently; no IPC channel keeps the two in sync.
for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

ipcMain.on("updater", (e, type) => {
  updater(type);
});

/**
 * Runs the save dialog and keeps the path, so the renderer never learns one. It used to
 * receive the path and hand it back, which made every write handler an arbitrary-file-write
 * primitive. `e2ePath` bypasses the dialog only when PLAYWRIGHT_RUN is set in this process.
 */
async function resolveSaveTarget({ options, e2ePath }: SaveRequest): Promise<string | null> {
  if (e2ePath && getEnv("PLAYWRIGHT_RUN")) return e2ePath;
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  return canceled ? null : (filePath ?? null);
}

ipcMain.handle(
  "save-logs",
  async (_event, request: SaveRequest, rendererLogsStr: string): Promise<SaveOutcome> => {
    const target = await resolveSaveTarget(request);
    if (!target) return "canceled";

    const internalLogsChronological = InMemoryLogger.getLogger().getLogs().reverse();

    // Pre-stringified by the caller: passing the array itself hits Electron's serialiser,
    // which cannot carry the circular references the in-memory logs contain.
    let rendererLogsChronological: Array<{ timestamp: string }> = [];
    try {
      rendererLogsChronological = JSON.parse(rendererLogsStr).reverse();
    } catch (e) {
      console.warn("Error while parsing logs from the renderer process", e);
      return "failed";
    }

    await fs.writeFile(
      target,
      mergeAllLogsJSON(
        rendererLogsChronological,
        internalLogsChronological,
        getEnv("EXPORT_MAX_LOGS"),
      ),
    );
    return "saved";
  },
);

ipcMain.handle("openUserDataDirectory", () => shell.openPath(app.getPath("userData")));

// `openURL` validates the scheme, so a compromised renderer cannot use this to launch
// arbitrary protocol handlers.
ipcMain.on("shell:open-external", (_event, url: string) => openURL(url));

/**
 * Clipboard access on the renderer's behalf, rather than `navigator.clipboard`: the window's
 * permission handler grants only `hid`, so a clipboard-read from the renderer is denied —
 * and widening that policy would give back part of what this migration removes.
 */
ipcMain.on("clipboard:write-text", (_event, text: string) => clipboard.writeText(text));

ipcMain.handle("clipboard:read-text", () => clipboard.readText());

/**
 * Dev-only, for the renderer's config-mismatch diagnostic. The environment name is checked
 * against a fixed list rather than interpolated into the path, so a compromised renderer
 * cannot use this to read arbitrary files.
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
 * Local Live App manifests (Developer settings). The dialog and the file I/O happen together
 * here, so the renderer only ever sees file contents, never a path it could reuse.
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
  async (_event, request: SaveRequest, csv: string): Promise<SaveOutcome> => {
    if (!csv) return "failed";
    try {
      const target = await resolveSaveTarget(request);
      if (!target) return "canceled";
      await fs.writeFile(target, csv);
      return "saved";
    } catch {
      return "failed";
    }
  },
);

ipcMain.handle(
  "save-png",
  async (_event, options: Electron.SaveDialogOptions, base64: string): Promise<SaveOutcome> => {
    if (!base64) return "failed";
    try {
      const target = await resolveSaveTarget({ options });
      if (!target) return "canceled";
      await fs.writeFile(target, Buffer.from(base64, "base64"));
      return "saved";
    } catch {
      return "failed";
    }
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
