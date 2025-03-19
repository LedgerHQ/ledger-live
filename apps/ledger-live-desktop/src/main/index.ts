import "./setup"; // Needs to be imported first
import {
  app,
  Menu,
  ipcMain,
  session,
  webContents,
  shell,
  BrowserWindow,
  dialog,
  protocol,
} from "electron";
import Store from "electron-store";
import menu from "./menu";
import {
  createMainWindow,
  getMainWindow,
  getMainWindowAsync,
  loadWindow,
} from "./window-lifecycle";
import { getSentryEnabled, setUserId } from "./internal-lifecycle";
import db from "./db";
import debounce from "lodash/debounce";
import sentry from "~/sentry/main";
import { SettingsState } from "~/renderer/reducers/settings";
import { User } from "~/renderer/storage";

Store.initRenderer();

const gotLock = app.requestSingleInstanceLock();
const { LEDGER_CONFIG_DIRECTORY } = process.env;
const userDataDirectory = LEDGER_CONFIG_DIRECTORY || app.getPath("userData");

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
      if (value === undefined) return settings?.sentryLogs;
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
  ipcMain.handle("hasEncryptionKey", () => {
    return db.hasEncryptionKey();
  });
  ipcMain.handle("setEncryptionKey", (event, { encryptionKey }) => {
    return db.setEncryptionKey(encryptionKey);
  });
  ipcMain.handle("removeEncryptionKey", () => {
    return db.removeEncryptionKey();
  });
  ipcMain.handle("isEncryptionKeyCorrect", (event, { encryptionKey }) => {
    return db.isEncryptionKeyCorrect(encryptionKey);
  });
  ipcMain.handle("hasBeenDecrypted", () => {
    return db.hasBeenDecrypted();
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
      if (!window || window.isDestroyed()) return;
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
      if (!window || window.isDestroyed()) return;
      const [x, y] = window.getPosition();
      db.setKey("windowParams", `${window.name}.positions`, {
        x,
        y,
      });
    }, 300),
  );

  if (__DEV__ || process.env.PLAYWRIGHT_RUN) {
    // Catch ledgerlive:// deep-link requests in dev mode from the app or live-apps
    // We cannot get deep-links from outside the app, from the browser for example
    protocol.handle("ledgerlive", request => {
      const url = request.url;
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

      return new Response();
    });
  }

  await clearSessionCache(window.webContents.session);
});

ipcMain.on("set-background-color", (_, color) => {
  const w = getMainWindow();
  if (w) {
    w.setBackgroundColor(color);
  }
});

ipcMain.on("app-quit", () => {
  app.quit();
});

ipcMain.handle("show-open-dialog", (_, opts) => dialog.showOpenDialog(opts));
ipcMain.handle("show-save-dialog", (_, opts) => dialog.showSaveDialog(opts));

ipcMain.on("deep-linking", (_, l) => {
  const win = getMainWindow();
  if (win) win.webContents.send("deep-linking", l);
});

ipcMain.on("app-reload", () => {
  const w = getMainWindow();
  if (w) {
    w.reload();
  }
});
ipcMain.on("show-app", () => {
  const w = getMainWindow();
  if (w) {
    show(w);
  }
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
  const extensions = ["REACT_DEVELOPER_TOOLS", "REDUX_DEVTOOLS"];
  await Promise.all(
    extensions.map(name =>
      installer.default(installer[name], {
        forceDownload,
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      }),
    ),
  ).catch(console.error);
  //Hack to load React devtools extension without a reload due to this issue: https://github.com/MarshallOfSound/electron-devtools-installer/issues/244
  return session.defaultSession.getAllExtensions().map(e => {
    if (e.name === "React Developer Tools") {
      session.defaultSession.loadExtension(e.path);
    }
  });
}
function clearSessionCache(session: Electron.Session): Promise<void> {
  return session.clearCache();
}
function show(win: BrowserWindow) {
  win.show();
  setImmediate(() => win.focus());
}
