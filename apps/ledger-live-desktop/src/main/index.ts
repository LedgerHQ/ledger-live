// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@electron/remote/main").initialize();

import "./setup"; // Needs to be imported first
import { app, Menu, ipcMain, session, webContents, shell, BrowserWindow } from "electron";
import Store from "electron-store";
import menu from "./menu";
import path from "path";
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
import sentry from "~/sentry/main";
import { SettingsState } from "~/renderer/reducers/settings";
import { User } from "~/renderer/storage";

Store.initRenderer();

const gotLock = app.requestSingleInstanceLock();
const userDataDirectory = resolveUserDataDirectory();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
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
      .catch((err: unknown) => console.log(err));
  });
});
app.on("ready", async () => {
  app.dirname = __dirname;
  if (__DEV__) {
    await installExtensions();
  }
  db.init(userDataDirectory);
  const settings = (await db.getKey("app", "settings")) as SettingsState;
  const user: User = (await db.getKey("app", "user")) as User;
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
    return defaultSession.clearStorageData();
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

  // To handle opening new windows from webview
  // cf. https://gist.github.com/codebytere/409738fcb7b774387b5287db2ead2ccb
  ipcMain.on("webview-dom-ready", (_, id) => {
    const wc = webContents.fromId(id);
    wc?.setWindowOpenHandler(({ url }) => {
      const protocol = new URL(url).protocol;
      if (["https:", "http:"].includes(protocol)) {
        shell.openExternal(url);
      }
      return {
        action: "deny",
      };
    });
  });
  Menu.setApplicationMenu(menu);
  const windowParams = (await db.getKey("windowParams", "MainWindow", {})) as Parameters<
    typeof createMainWindow
  >[0];
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
      db.setKey("windowParams", `${window.name}.positions`, {
        x,
        y,
      });
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const installer = require("electron-devtools-installer");
  const forceDownload = true; // process.env.UPGRADE_EXTENSIONS
  const extensions = [/*"REACT_DEVELOPER_TOOLS",*/ "REDUX_DEVTOOLS"];
  // Temporary solution while Electron doesn't support manifest V3 extensions
  // https://github.com/electron/electron/issues/36545
  const reactDevToolsPath = path.dirname(require.resolve("@ledgerhq/react-devtools/package.json"));
  session.defaultSession.loadExtension(reactDevToolsPath);
  return Promise.all(
    extensions.map(name =>
      installer.default(installer[name], {
        loadExtensionOptions: {
          allowFileAccess: true,
          forceDownload,
        },
      }),
    ),
  ).catch(console.error);
}
function clearSessionCache(session: Electron.Session): Promise<void> {
  return session.clearCache();
}
function show(win: BrowserWindow) {
  win.show();
  setImmediate(() => win.focus());
}
