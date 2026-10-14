import fs from "fs";
import path from "path";
import "./starts-console";
import "./setup"; // Needs to be imported first
import { app, Menu, ipcMain, type BrowserWindow, protocol, session } from "electron";
import menu from "./menu";
import {
  createEarlyMainWindow,
  applyWindowParams,
  getMainWindow,
  getMainWindowAsync,
  loadWindow,
} from "./window-lifecycle";
import db from "./db";
import { createKeyAttemptThrottle, type KeyAttemptOutcome } from "./db/keyAttemptThrottle";
import { assertRendererNamespace } from "./db/rendererNamespaces";
import { UserDataCleanup } from "./cleanupUserData";
import debounce from "lodash/debounce";
import type { SettingsState } from "~/renderer/reducers/settings";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import {
  setupZcashNativeHost,
  cleanupZcashNativeHost,
} from "@ledgerhq/coin-zcash/network/ipc/main-host";
import { setupWebviewHandlers } from "./webviewHandlers";
import { setupExplorerSessionAffinity } from "./explorerSessionAffinity";
import { CHANNELS } from "~/bridge/contract";
// End import timing, start initialization
console.timeEnd("T-imports");
console.time("T-init");

setUserDataPath();

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
          sendDeepLink(w, uri[0]);
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
          sendDeepLink(w, url);
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
  const userDataCleanup = new UserDataCleanup(userDataDirectory, {
    patterns: [/^app\.json\..+$/],
  });
  await userDataCleanup.cleanup();
  db.init(userDataDirectory);

  // Defer extension installation to not block startup
  if (__DEV__) {
    setImmediate(() => {
      installExtensions().catch(e => console.warn("Dev extensions install failed:", e));
    });
  }

  // Measure database initialization and first reads
  console.time("T-db");
  const settings = (await db.getKey("app", "settings")) as SettingsState;
  console.timeEnd("T-db");

  // Set up ZCash native host: lazy-spawn a UtilityProcess hosting the
  // napi-rs engine, bridged to the renderer via IPC. The engine is the one of
  // the standalone coin-zcash module, the only module the renderer ever asks
  // for it (see @ledgerhq/coin-zcash/network/ipc/main-host).
  setupZcashNativeHost();

  ipcMain.handle(CHANNELS.getKey, (event, { ns, keyPath, defaultValue }) => {
    assertRendererNamespace(ns);
    return db.getKey(ns, keyPath, defaultValue);
  });
  ipcMain.handle(CHANNELS.setKey, (event, { ns, keyPath, value }) => {
    assertRendererNamespace(ns);
    return db.setKey(ns, keyPath, value);
  });
  ipcMain.handle(CHANNELS.hasEncryptionKey, () => {
    return db.hasEncryptionKey();
  });
  const throttleKeyAttempt = createKeyAttemptThrottle();
  const checkedOutcome = (checked: boolean): KeyAttemptOutcome =>
    checked ? "correct" : "unchecked";
  ipcMain.handle(
    CHANNELS.setEncryptionKey,
    async (event, { encryptionKey, currentEncryptionKey }) => {
      await throttleKeyAttempt(
        () => db.setEncryptionKey(encryptionKey, currentEncryptionKey),
        checkedOutcome,
      );
    },
  );
  ipcMain.handle(CHANNELS.removeEncryptionKey, async (event, { currentEncryptionKey }) => {
    await throttleKeyAttempt(() => db.removeEncryptionKey(currentEncryptionKey), checkedOutcome);
  });
  ipcMain.handle(CHANNELS.isEncryptionKeyCorrect, (event, { encryptionKey }) => {
    return throttleKeyAttempt(
      () => db.isEncryptionKeyCorrect(encryptionKey),
      correct => (correct ? "correct" : "wrong"),
    );
  });
  ipcMain.handle(CHANNELS.hasBeenDecrypted, () => {
    return db.hasBeenDecrypted();
  });
  ipcMain.handle(CHANNELS.resetAll, () => {
    return db.resetAll();
  });
  ipcMain.handle(CHANNELS.reload, () => {
    return db.reload();
  });
  ipcMain.handle(CHANNELS.cleanCache, () => {
    return db.cleanCache();
  });
  ipcMain.handle(CHANNELS.reloadRenderer, () => {
    console.log("reloading renderer ...");
    loadWindow();
  });
  setupWebviewHandlers(SUPPORTED_SCHEMES);
  setupExplorerSessionAffinity(session.defaultSession);
  Menu.setApplicationMenu(menu);

  // Apply window parameters now that we have DB data
  const windowParams = (await db.getKey("windowParams", "MainWindow", {})) as Parameters<
    typeof applyWindowParams
  >[0];
  await applyWindowParams(windowParams, settings);

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
              sendDeepLink(w, url);
            }
          })
          .catch((err: unknown) => console.log(err));

        return new Response();
      });
    });
  }

  await clearSessionCache(window.webContents.session);
});

app.on("window-all-closed", () => {
  cleanupZcashNativeHost();
  app.quit();
});

ipcMain.on(CHANNELS.setBackgroundColor, (_, color) => {
  const w = getMainWindow();
  if (w) {
    w.setBackgroundColor(color);
  }
});

ipcMain.on(CHANNELS.appQuit, () => {
  app.quit();
});

ipcMain.once(CHANNELS.appRelaunch, () => {
  app.relaunch();
  app.quit();
});

ipcMain.on(CHANNELS.deepLinking, (_, l) => {
  const win = getMainWindow();
  if (win) sendDeepLink(win, l);
});

ipcMain.on(CHANNELS.appReload, () => {
  const w = getMainWindow();
  if (w) {
    w.reload();
  }
});
ipcMain.on(CHANNELS.showApp, () => {
  const w = getMainWindow();
  if (w) {
    show(w);
  }
});

ipcMain.on(CHANNELS.readyToShow, () => {
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
        sendDeepLink(w, uri[0]);
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
  await app.whenReady();
  await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS], {
    loadExtensionOptions: {
      allowFileAccess: true,
    },
  });
}

function clearSessionCache(targetSession: Electron.Session): Promise<void> {
  return targetSession.clearCache();
}
function show(win: BrowserWindow) {
  win.show();
  setImmediate(() => win.focus());
}

/**
 * Sends a deep-link URL to the renderer process.
 * Waits for the webContents to finish loading if it's still initializing,
 * preventing the message from being lost during cold start.
 */
function sendDeepLink(win: BrowserWindow, url: string) {
  if (!("send" in win.webContents)) return;

  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", () => {
      win.webContents.send(CHANNELS.deepLinking, url);
    });
  } else {
    win.webContents.send(CHANNELS.deepLinking, url);
  }
}
