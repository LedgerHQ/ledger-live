import "./env";
import "~/live-common-setup-base";
import { captureException } from "~/sentry/main";
import { app, ipcMain, powerSaveBlocker, shell } from "electron";
import contextMenu from "electron-context-menu";
import { LocalTracer, log } from "@ledgerhq/logs";
import fs from "fs/promises";
import updater from "./updater";
import path from "path";
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

function customStringify(obj: unknown) {
  const orderedKeys = [
    "logIndex",
    "date",
    "process",
    "type",
    "level",
    "id",
    "message",
    "data",
    "context",
  ];

  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const orderedObject: Record<string, unknown> = {};

        // Add the keys in the specified order
        for (const key of orderedKeys) {
          if (key in value) {
            orderedObject[key] = value[key];
          }
        }

        // Add the remaining keys
        for (const key in value) {
          if (!(key in orderedObject)) {
            orderedObject[key] = value[key];
          }
        }

        return orderedObject;
      }
      return value;
    },
    2,
  );
}

/**
 * Saves logs from the renderer process and logs recorded from the internal process to a file.
 */
ipcMain.handle(
  "save-logs",
  async (_event, path: Electron.SaveDialogReturnValue, rendererLogsStr: string) => {
    if (!path.canceled && path.filePath) {
      const inMemoryLogger = InMemoryLogger.getLogger();
      const internalLogs = inMemoryLogger.getLogs();

      const maxLogCount = getEnv("EXPORT_MAX_LOGS");

      // The deserialization would have been done internally by electron if `rendererLogs` was passed directly as a JS object/array.
      // But it avoids certain issues with the serialization/deserialization done by electron.
      let rendererLogs: Array<{ timestamp: string }> = [];
      try {
        rendererLogs = JSON.parse(rendererLogsStr); // TODO: typeguard this sh
      } catch (error) {
        console.error("Error while parsing logs from the renderer process", error);
        return;
      }

      console.log(
        `Saving ${rendererLogs.length} logs from the renderer process and ${internalLogs.length} logs from the internal process`,
      );

      // function that compares a date in the format "2024-08-13T15:14:38.335Z" and a second param date of type Date
      function compareLogs(
        a: { date: string; process: string; internalIndex: number },
        b: { date: string; process: string; internalIndex: number },
      ) {
        const dateCompared = a.date.localeCompare(b.date);
        if (dateCompared !== 0 || a.process !== b.process) return dateCompared;
        return a.internalIndex - b.internalIndex;
      }

      const allLogs = [
        // Reverse the logs to have the oldest logs first
        ...rendererLogs.reverse().map((log, index) => {
          const { timestamp, ...rest } = log;
          return {
            ...rest,
            process: "electron-renderer",
            date: log.timestamp,
            internalIndex: index,
          };
        }),
        // Reverse the logs to have the oldest logs first
        ...internalLogs.reverse().map((log, index) => ({
          ...log,
          process: "electron-internal",
          date: typeof log.date === "string" ? log.date : log.date.toISOString(),
          internalIndex: index,
        })),
      ]
        .sort(compareLogs)
        .map((log, index) => {
          const { internalIndex, ...rest } = log;
          return { ...rest, logIndex: index };
        })
        .slice(-maxLogCount);

      if (rendererLogs.length + internalLogs.length > maxLogCount) {
        allLogs.unshift(
          // @ts-expect-error we don't care
          `Exporting logs: Only the last ${maxLogCount} logs are saved. To change this limit, set the EXPORT_MAX_LOGS env variable.`,
        );
      }

      fs.writeFile(path.filePath, customStringify(allLogs));
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
    } catch (error) {
      // ignore
    }
    return false;
  },
);

const lssFileName = "lss.json";
ipcMain.handle("generate-lss-config", async (event, data: string): Promise<boolean> => {
  const userDataDirectory = app.getPath("userData");
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
  const userDataDirectory = app.getPath("userData");
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
    const userDataDirectory = app.getPath("userData");
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

ipcMain.handle("activate-keep-screen-awake", () => {
  return powerSaveBlocker.start("prevent-display-sleep");
});

ipcMain.handle("deactivate-keep-screen-awake", (_ev, id?: number) => {
  if (id !== undefined && !Number.isNaN(id)) {
    powerSaveBlocker.stop(id as number);
  }
});

process.setMaxListeners(0);

let id = 0;
const doLog = (type: string, message: string, data: unknown) => {
  InMemoryLogger.getLogger().log({ type, message, date: new Date(), id: (id++).toString(), data });
};

// In production mode, we do not want Electron's default GUI to show the error. Instead we will output to the console.

process.on("uncaughtException", function (error) {
  const stack = error.stack ? error.stack : `${error.name}: ${error.message}`;
  const message = "Uncaught Exception:\n" + stack;
  console.error(message);
  doLog('process.on("uncaughtException")', message, { error });
});

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
