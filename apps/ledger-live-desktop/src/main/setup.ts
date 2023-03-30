import "~/live-common-setup-base";
import { captureException } from "~/sentry/main";
import { ipcMain } from "electron";
import contextMenu from "electron-context-menu";
import { log } from "@ledgerhq/logs";
import { fsWriteFile, fsReadFile, fsUnlink } from "~/helpers/fs";
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
  async (
    event,
    path: {
      canceled: boolean;
      filePath: string;
    },
    experimentalLogs: string,
  ) => !path.canceled && path.filePath && fsWriteFile(path.filePath, experimentalLogs),
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
        await fsWriteFile(path.filePath, csv);
        return true;
      }
    } catch (error) {}
    return false;
  },
);
const lssFileName = "lss.json";
ipcMain.handle(
  "generate-lss-config",
  async (event, data: string): Promise<boolean> => {
    const userDataDirectory = resolveUserDataDirectory();
    const filePath = path.resolve(userDataDirectory, lssFileName);
    if (filePath) {
      if (filePath && data) {
        await fsWriteFile(filePath, data, {
          mode: "640",
        });
        log("satstack", "wrote to lss.json file");
        return true;
      }
    }
    return false;
  },
);
ipcMain.handle(
  "delete-lss-config",
  async (event): Promise<boolean> => {
    const userDataDirectory = resolveUserDataDirectory();
    const filePath = path.resolve(userDataDirectory, lssFileName);
    if (filePath) {
      await fsUnlink(filePath);
      log("satstack", "deleted lss.json file");
      return true;
    }
    return false;
  },
);
ipcMain.handle(
  "load-lss-config",
  async (event): Promise<string | undefined | null> => {
    try {
      const userDataDirectory = resolveUserDataDirectory();
      const filePath = path.resolve(userDataDirectory, lssFileName);
      if (filePath) {
        const contents = await fsReadFile(filePath, "utf8");
        log("satstack", `loaded lss.json file with length ${contents.length}`);
        return contents;
      }
    } catch (e) {
      log("satstack", "tried to load lss.json");
    }
    return undefined;
  },
);
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
