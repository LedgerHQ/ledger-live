import "~/live-common-setup-base";
import { captureException } from "~/sentry/main";
import { ipcMain } from "electron";
import contextMenu from "electron-context-menu";
import { log } from "@ledgerhq/logs";
import fs from "fs/promises";
import updater from "./updater";
import resolveUserDataDirectory from "~/helpers/resolveUserDataDirectory";
import path from "path";
import { InMemoryLogger } from "./logger";

ipcMain.on("mainCrashTest", () => {
  captureException(new Error("CrashTestMain"));
});

ipcMain.on("updater", (e, type) => {
  updater(type);
});

/**
 * Saves logs from the renderer thread and logs recorded from the internal thread to a file.
 */
ipcMain.handle(
  "save-logs",
  async (_event, path: Electron.SaveDialogReturnValue, rendererLogs: unknown[]) => {
    if (!path.canceled && path.filePath) {
      const inMemoryLogger = InMemoryLogger.getLogger();
      const internalLogs = inMemoryLogger.getLogs();
      console.log(
        `Saving ${rendererLogs.length} logs from the renderer thread and ${internalLogs.length} logs from the internal thread`,
      );

      // Merging according to a `date` (internal logs) / `timestamp` (most of renderer logs) does not seem necessary.
      // Simply pushes all the internal logs after the renderer logs.
      // Note: this is not respecting the `EXPORT_MAX_LOGS` env var, but this is fine.
      rendererLogs.push(
        { type: "logs-separator", message: "Logs coming from the internal thread" },
        ...internalLogs,
      );

      fs.writeFile(path.filePath, JSON.stringify(rendererLogs, null, 2));
    } else {
      console.warn("No path given to save logs");
    }
  },
);

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
    } catch (error) {
      // ignore
    }
    return false;
  },
);

const lssFileName = "lss.json";
ipcMain.handle("generate-lss-config", async (event, data: string): Promise<boolean> => {
  const userDataDirectory = resolveUserDataDirectory();
  const filePath = path.resolve(userDataDirectory, lssFileName);
  if (filePath) {
    if (filePath && data) {
      await fs.writeFile(filePath, data, { mode: "640" });
      log("satstack", "wrote to lss.json file");
      return true;
    }
  }
  return false;
});

ipcMain.handle("delete-lss-config", async (): Promise<boolean> => {
  const userDataDirectory = resolveUserDataDirectory();
  const filePath = path.resolve(userDataDirectory, lssFileName);
  if (filePath) {
    await fs.unlink(filePath);
    log("satstack", "deleted lss.json file");
    return true;
  }
  return false;
});

ipcMain.handle("load-lss-config", async (): Promise<string | undefined | null> => {
  try {
    const userDataDirectory = resolveUserDataDirectory();
    const filePath = path.resolve(userDataDirectory, lssFileName);
    if (filePath) {
      const contents = await fs.readFile(filePath, "utf8");
      log("satstack", `loaded lss.json file with length ${contents.length}`);
      return contents;
    }
  } catch (e) {
    log("satstack", "tried to load lss.json");
  }
  return undefined;
});

process.setMaxListeners(0);

// eslint-disable-next-line no-console
console.log(`Ledger Live ${__APP_VERSION__}`);
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
console.log(`Ledger Live version: ${__APP_VERSION__}`, {
  type: "system-info",
});
