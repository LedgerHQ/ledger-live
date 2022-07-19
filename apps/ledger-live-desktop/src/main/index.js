// @flow

require("@electron/remote/main").initialize();

/* eslint-disable import/first */
import "./setup";
import { app, Menu, ipcMain, session } from "electron";
import menu from "./menu";
import {
  createMainWindow,
  getMainWindow,
  getMainWindowAsync,
  loadWindow,
} from "./window-lifecycle";
import { getSentryEnabled, setUserId } from "./internal-lifecycle";
import resolveUserDataDirectory from "~/helpers/resolveUserDataDirectory";
import db from "./db";
import debounce from "lodash/debounce";
import logger from "~/logger";
import sentry from "~/sentry/main";

app.allowRendererProcessReuse = false;

const gotLock = app.requestSingleInstanceLock();
const userDataDirectory = resolveUserDataDirectory();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    const w = getMainWindow();
    if (w) {
      if (w.isMinimized()) {
        w.restore();
      }
      w.focus();

      // Deep linking for when the app is already running (Windows, Linux)
      if (process.platform === "win32" || process.platform === "linux") {
        const uri = commandLine.filter(arg => arg.startsWith("ledgerlive://"));

        if (uri.length) {
          if ("send" in w.webContents) {
            w.webContents.send("deep-linking", uri[0]);
          }
        }
      }
    }
  });
}

app.on("activate", () => {
  const w = getMainWindow();
  if (w) {
    w.focus();
  }
});

app.on("will-finish-launching", () => {
  // macOS deepLink
  app.on("open-url", (event, url) => {
    event.preventDefault();
    getMainWindowAsync()
      .then(w => {
        if (w) {
          show(w);
          if ("send" in w.webContents) {
            w.webContents.send("deep-linking", url);
          }
        }
      })
      .catch(err => console.log(err));
  });
});

app.on("ready", async () => {
  app.dirname = __dirname;
  if (__DEV__) {
    await installExtensions();
  }

  db.init(userDataDirectory);

  const settings = await db.getKey("app", "settings");
  const user = await db.getKey("app", "user");

  const userId = user?.id;
  if (userId) {
    setUserId(userId);
    sentry(() => {
      const value = getSentryEnabled();
      if (value === null) return settings?.sentryLogs;
      return value;
    }, userId);
  }

  /**
   * Clears the session’s HTTP cache
   * Used to remove third party cached auth tokens, among other things
   */
  ipcMain.handle("clearStorageData", () => {
    const defaultSession = session.defaultSession;

    defaultSession.clearStorageData().then(
      () => {
        logger.log("session storageData cleared");
      },
      error => {
        logger.error(error);
      },
    );
  });

  ipcMain.handle("getKey", (event, { ns, keyPath, defaultValue }) => {
    return db.getKey(ns, keyPath, defaultValue);
  });

  ipcMain.handle("setKey", (event, { ns, keyPath, value }) => {
    return db.setKey(ns, keyPath, value);
  });

  ipcMain.handle("hasEncryptionKey", (event, { ns, keyPath }) => {
    return db.hasEncryptionKey(ns, keyPath);
  });

  ipcMain.handle("setEncryptionKey", (event, { ns, keyPath, encryptionKey }) => {
    return db.setEncryptionKey(ns, keyPath, encryptionKey);
  });

  ipcMain.handle("removeEncryptionKey", (event, { ns, keyPath }) => {
    return db.removeEncryptionKey(ns, keyPath);
  });

  ipcMain.handle("isEncryptionKeyCorrect", (event, { ns, keyPath, encryptionKey }) => {
    return db.isEncryptionKeyCorrect(ns, keyPath, encryptionKey);
  });

  ipcMain.handle("hasBeenDecrypted", (event, { ns, keyPath }) => {
    return db.hasBeenDecrypted(ns, keyPath);
  });

  ipcMain.handle("resetAll", () => {
    return db.resetAll();
  });

  ipcMain.handle("reload", () => {
    return db.reload();
  });

  ipcMain.handle("cleanCache", () => {
    return db.cleanCache();
  });

  ipcMain.handle("reloadRenderer", () => {
    console.log("reloading renderer ...");
    loadWindow();
  });

  ipcMain.on("log", (event, { log }) => logger.log(log));

  Menu.setApplicationMenu(menu);

  const windowParams = await db.getKey("windowParams", "MainWindow", {});
  const window = await createMainWindow(windowParams, settings);

  window.on(
    "resize",
    debounce(() => {
      const [width, height] = window.getSize();
      db.setKey("windowParams", `${window.name}.dimensions`, {
        width,
        height,
      });
    }, 300),
  );

  window.on(
    "move",
    debounce(() => {
      const [x, y] = window.getPosition();
      db.setKey("windowParams", `${window.name}.positions`, { x, y });
    }, 300),
  );

  await clearSessionCache(window.webContents.session);
});

ipcMain.on("ready-to-show", () => {
  const w = getMainWindow();
  if (w) {
    show(w);

    // Deep linking for when the app is not running already (Windows, Linux)
    if (process.platform === "win32" || process.platform === "linux") {
      const { argv } = process;
      const uri = argv.filter(arg => arg.startsWith("ledgerlive://"));

      if (uri.length) {
        if ("send" in w.webContents) {
          w.webContents.send("deep-linking", uri[0]);
        }
      }
    }
  }
});

async function installExtensions() {
  const installer = require("electron-devtools-installer");
  const forceDownload = true; // process.env.UPGRADE_EXTENSIONS
  const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];
  return Promise.all(
    extensions.map(name =>
      installer.default(installer[name], {
        loadExtensionOptions: { allowFileAccess: true, forceDownload },
      }),
    ),
  ).catch(console.error);
}

function clearSessionCache(session) {
  return new Promise(resolve => {
    session.clearCache(resolve);
  });
}

function show(win) {
  win.show();
  setImmediate(() => win.focus());
}
