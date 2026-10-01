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
import { CHANNELS, type SaveOutcome, type SaveRequest } from "~/bridge/contract";

for (const k in process.env) {
  setEnvUnsafe(k, process.env[k]);
}

ipcMain.on(CHANNELS.updater, (e, type) => {
  updater(type);
});

// Main owns the path, so the renderer cannot turn a write handler into an arbitrary file write.
async function resolveSaveTarget({ options, e2ePath }: SaveRequest): Promise<string | null> {
  if (e2ePath && getEnv("PLAYWRIGHT_RUN")) return e2ePath;
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  return canceled ? null : (filePath ?? null);
}

ipcMain.handle(
  CHANNELS.saveLogs,
  async (_event, request: SaveRequest, rendererLogsStr: string): Promise<SaveOutcome> => {
    const target = await resolveSaveTarget(request);
    if (!target) return "canceled";

    const internalLogsChronological = InMemoryLogger.getLogger().getLogs().reverse();

    let rendererLogsChronological: Array<{ timestamp: string }> = [];
    try {
      rendererLogsChronological = JSON.parse(rendererLogsStr).reverse();
    } catch (e) {
      console.warn("Error while parsing logs from the renderer process", e);
      return "failed";
    }

    try {
      await fs.writeFile(
        target,
        mergeAllLogsJSON(
          rendererLogsChronological,
          internalLogsChronological,
          getEnv("EXPORT_MAX_LOGS"),
        ),
      );
      return "saved";
    } catch (e) {
      console.warn("Could not write the exported logs", e);
      return "failed";
    }
  },
);

ipcMain.handle(CHANNELS.openUserDataDirectory, () => shell.openPath(app.getPath("userData")));

// openURL validates the scheme; do not swap it for shell.openExternal.
ipcMain.on(CHANNELS.openExternal, (_event, url: string) => openURL(url));

// Not navigator.clipboard: the permission handler grants the renderer only `hid`.
ipcMain.on(CHANNELS.clipboardWriteText, (_event, text: string) => clipboard.writeText(text));

ipcMain.handle(CHANNELS.clipboardReadText, () => clipboard.readText());

ipcMain.handle(
  CHANNELS.exportOperations,
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
  CHANNELS.savePng,
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

ipcMain.handle(CHANNELS.keepScreenAwake, () => {
  return powerSaveBlocker.start("prevent-display-sleep");
});

ipcMain.handle(CHANNELS.releaseScreenAwake, (_ev, id?: number) => {
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
