import "./setup";
import { BrowserWindow, screen, shell, app } from "electron";
import path from "path";
import { delay } from "@ledgerhq/live-common/promise";
import { URL } from "url";
import * as remoteMain from "@electron/remote/main";
const intFromEnv = (key: string, def: number): number => {
  const v = process.env[key];
  if (!isNaN(v)) return parseInt(v, 10);
  return def;
};
export const DEFAULT_WINDOW_WIDTH = intFromEnv("LEDGER_DEFAULT_WINDOW_WIDTH", 1024);
export const DEFAULT_WINDOW_HEIGHT = intFromEnv("LEDGER_DEFAULT_WINDOW_HEIGHT", 768);
export const MIN_WIDTH = intFromEnv("LEDGER_MIN_WIDTH", 1024);
export const MIN_HEIGHT = intFromEnv("LEDGER_MIN_HEIGHT", 700);
const { DEV_TOOLS } = process.env;
let mainWindow = null;
let theme;
export const getMainWindow = () => mainWindow;
export const getMainWindowAsync = async (maxTries = 5) => {
  if (maxTries <= 0) {
    throw new Error("could not get the mainWindow");
  }
  const w = getMainWindow();
  if (!w) {
    await delay(2000);
    return getMainWindowAsync(maxTries - 1);
  }
  return w;
};
const getWindowPosition = (width, height, display = screen.getPrimaryDisplay()) => {
  const { bounds } = display;
  return {
    x: Math.ceil(bounds.x + (bounds.width - width) / 2),
    y: Math.ceil(bounds.y + (bounds.height - height) / 2),
  };
};
const defaultWindowOptions = {
  icon: path.join(__dirname, "/build/icons/icon.png"),
  backgroundColor: "#fff",
  webPreferences: {
    // This is a TEMPORARY workaround for some of our backend not yet supporting CORS. we will remove this once it's the case. this is only for develop mode because production don't do strict CORS check at the moment.
    webSecurity: !(__DEV__ && process.env.BYPASS_CORS === "1"),
    webviewTag: true,
    blinkFeatures: "OverlayScrollbars",
    devTools: __DEV__ || DEV_TOOLS,
    experimentalFeatures: true,
    nodeIntegration: true,
    contextIsolation: false,
    spellcheck: false,
    // Legacy - allows listening to the "new-window" even in webviews.
    nativeWindowOpen: false,
  },
};
export const loadWindow = async () => {
  const url = __DEV__ ? INDEX_URL : path.join("file://", __dirname, "index.html");
  if (mainWindow) {
    /** Making the following variables easily accessible to the renderer thread:
     * - theme
     * - appLocale, cf. https://www.electronjs.org/fr/docs/latest/api/app#appgetlocale
     * */
    const fullUrl = new URL(url);
    fullUrl.searchParams.append("theme", theme);
    fullUrl.searchParams.append("appLocale", app.getLocale());
    await mainWindow.loadURL(fullUrl.href);
  }
};
export async function createMainWindow({ dimensions, positions }: any, settings: any) {
  theme =
    settings && settings.theme && ["light", "dark"].includes(settings.theme)
      ? settings.theme
      : "null";

  // TODO renderer should provide the saved window rectangle
  const width = dimensions ? dimensions.width : DEFAULT_WINDOW_WIDTH;
  const height = dimensions ? dimensions.height : DEFAULT_WINDOW_HEIGHT;
  const windowPosition = positions || getWindowPosition(width, height);
  const windowOptions = {
    ...defaultWindowOptions,
    x: windowPosition.x,
    y: windowPosition.y,
    ...(process.platform === "darwin"
      ? {
          frame: false,
          titleBarStyle: "hiddenInset",
        }
      : {}),
    width,
    height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preloader.bundle.js"),
      ...defaultWindowOptions.webPreferences,
    },
  };
  mainWindow = new BrowserWindow(windowOptions);
  remoteMain.enable(mainWindow.webContents);
  mainWindow.name = "MainWindow";
  loadWindow();
  if (DEV_TOOLS && !process.env.DISABLE_DEV_TOOLS) {
    mainWindow.webContents.on("did-frame-finish-load", () => {
      if (mainWindow) {
        mainWindow.webContents.once("devtools-open", () => {
          mainWindow && mainWindow.focus();
        });
        mainWindow.webContents.openDevTools();
      }
    });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("new-window", (event, url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  return mainWindow;
}
