import fs from "fs";
import path from "path";
import "./starts-console";
import "./setup"; // Needs to be imported first
import {
  app,
  Menu,
  ipcMain,
  session,
  webContents,
  shell,
  type BrowserWindow,
  dialog,
  protocol,
} from "electron";
import Store from "electron-store";
import menu from "./menu";
import {
  createEarlyMainWindow,
  applyWindowParams,
  getMainWindow,
  getMainWindowAsync,
  loadWindow,
} from "./window-lifecycle";
import db from "./db";
import debounce from "lodash/debounce";
import sentry, { setTags } from "~/sentry/main";
import type { SettingsState } from "~/renderer/reducers/settings";
import type { User } from "~/renderer/storage";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { setupTransportHandlers, cleanupTransports } from "./transportHandler";

// End import timing, start initialization
console.timeEnd("T-imports");
console.time("T-init");

setUserDataPath();

Store.initRenderer();

const SUPPORTED_SCHEMES = ["ledgerlive", "ledgerwallet"];

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
        const uri = commandLine.filter(arg =>
          SUPPORTED_SCHEMES.some(scheme => arg.startsWith(`${scheme}://`)),
        );
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
  console.timeEnd("T-init");
  app.dirname = __dirname;

  // Measure window creation time
  console.time("T-window");
  const window = createEarlyMainWindow();
  console.timeEnd("T-window");

  // Initialize database
  db.init(userDataDirectory);

  // Defer extension installation to not block startup
  if (__DEV__) {
    setImmediate(() => {
      installExtensions().catch(console.error);
    });
  }

  // Measure database initialization and first reads
  console.time("T-db");
  const settings = (await db.getKey("app", "settings")) as SettingsState;
  const user: User = (await db.getKey("app", "user")) as User;
  console.timeEnd("T-db");
  const userId = user?.id;
  if (userId) {
    sentry(() => settings?.sentryLogs, userId);
  }

  // Set up transport handlers for Speculos and HTTP proxy in main process
  setupTransportHandlers();

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
  ipcMain.handle("set-sentry-tags", (event, tags) => {
    setTags(tags);
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

  // Apply window parameters now that we have DB data
  const windowParams = (await db.getKey("windowParams", "MainWindow", {})) as Parameters<
    typeof applyWindowParams
  >[0];
  await applyWindowParams(windowParams, settings);

  let status: number = 0;
  window.on("close", e => {
    if (status === 0) {
      e.preventDefault();
      getMainWindowAsync()
        .then(w => {
          status = 1;
          if (w && "send" in w.webContents) {
            w.webContents.send("app-close");
          } else {
            w.close();
          }
        })
        .catch((err: unknown) => console.log(err));
    }
  });

  // Setup window event handlers
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
    SUPPORTED_SCHEMES.forEach(scheme => {
      protocol.handle(scheme, request => {
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
    });
  }

  await clearSessionCache(window.webContents.session);
});

// Cleanup transports on app shutdown
app.on("before-quit", () => {
  console.log("App shutting down, cleaning up transports...");
  cleanupTransports();
});

app.on("window-all-closed", () => {
  cleanupTransports();
  app.quit();
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
  console.timeEnd("T-ready");
  const totalTime = process.uptime() * 1000;
  console.log(`TOTAL BOOT TIME: ${totalTime.toFixed(0)}ms`);
  const w = getMainWindow();
  if (w) {
    show(w);

    // Deep linking for when the app is not running already (Windows, Linux)
    if (process.platform === "win32" || process.platform === "linux") {
      const { argv } = process;
      const uri = argv.filter(arg =>
        SUPPORTED_SCHEMES.some(scheme => arg.startsWith(`${scheme}://`)),
      );
      if (uri.length) {
        show(w);
        if ("send" in w.webContents) {
          w.webContents.send("deep-linking", uri[0]);
        }
      }
    }
  }
});

// Keep using "Ledger Live" in the userData path for backward compatibility.
// This way users could even rollback to older versions and keep their data.
// While a migration would only work for future versions.
function setUserDataPath() {
  const currentName = app.getName();
  const defaultPath = app.getPath("userData");

  if (
    process.env.LEDGER_CONFIG_DIRECTORY ||
    !app.getPath("userData").endsWith(currentName) ||
    fs.existsSync(path.resolve(defaultPath, "app.json")) // Don't change if the default path already exists this could allow a migration later
  ) {
    return;
  }

  const legacyName = currentName.replace("Ledger Wallet", "Ledger Live");
  app.setPath("userData", `${defaultPath.slice(0, -currentName.length)}${legacyName}`);
}

async function installExtensions() {
  // https://github.com/MarshallOfSound/electron-devtools-installer#usage
  app.whenReady().then(() => {
    installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS], {
      loadExtensionOptions: {
        allowFileAccess: true,
      },
    }).catch(console.error);
  });
}

function clearSessionCache(session: Electron.Session): Promise<void> {
  return session.clearCache();
}
function show(win: BrowserWindow) {
  win.show();
  setImmediate(() => win.focus());
}
