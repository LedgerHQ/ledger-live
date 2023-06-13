import "~/live-common-setup-base";
import { captureException } from "~/sentry/main";
import { ipcMain } from "electron";
import contextMenu from "electron-context-menu";
import { log } from "@ledgerhq/logs";
import fs from "fs/promises";
import updater from "./updater";
import resolveUserDataDirectory from "~/helpers/resolveUserDataDirectory";
import path from "path";
ipcMain.on("mainCrashTest", () => {
  captureException(new Error("CrashTestMain"));
});
ipcMain.on("updater", (e, type) => {
  updater(type);
});
ipcMain.handle(
  "save-logs",
  async (event, path: Electron.SaveDialogReturnValue, experimentalLogs: string) =>
    !path.canceled && path.filePath && fs.writeFile(path.filePath, experimentalLogs),
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
