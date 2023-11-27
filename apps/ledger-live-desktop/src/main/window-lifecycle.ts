import "./setup";
import { BrowserWindow, screen, app, WebPreferences } from "electron";
import path from "path";
import { delay } from "@ledgerhq/live-common/promise";
import { URL } from "url";

const intFromEnv = (key: string, def: number): number => {
  const v = process.env[key];
  if (v && !isNaN(+v)) return parseInt(v, 10);
  return def;
};
export const DEFAULT_WINDOW_WIDTH = intFromEnv("LEDGER_DEFAULT_WINDOW_WIDTH", 1024);
export const DEFAULT_WINDOW_HEIGHT = intFromEnv("LEDGER_DEFAULT_WINDOW_HEIGHT", 768);
export const MIN_WIDTH = intFromEnv("LEDGER_MIN_WIDTH", 1024);
export const MIN_HEIGHT = intFromEnv("LEDGER_MIN_HEIGHT", 700);
const { DEV_TOOLS, DISABLE_DEV_TOOLS, BYPASS_CORS, IGNORE_CERTIFICATE_ERRORS } = process.env;

// Used for minirecover (recover local dev env)
if (__DEV__ && IGNORE_CERTIFICATE_ERRORS) {
  app.commandLine.appendSwitch("ignore-certificate-errors");
}

let mainWindow: BrowserWindow | null = null;
let theme: string | undefined | null;

export const getMainWindow = () => mainWindow;

export const getMainWindowAsync = async (maxTries = 5): Promise<BrowserWindow> => {
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

const getWindowPosition = (width: number, height: number, display = screen.getPrimaryDisplay()) => {
  const { bounds } = display;
  return {
    x: Math.ceil(bounds.x + (bounds.width - width) / 2),
    y: Math.ceil(bounds.y + (bounds.height - height) / 2),
  };
};

const webPreferences: WebPreferences = {
  // https://ledgerhq.atlassian.net/browse/LIVE-6785 : This is a TEMPORARY workaround for some of our backend not yet supporting CORS. we will remove this once it's the case. this is only for develop mode because production don't do strict CORS check at the moment.
  webSecurity: !(__DEV__ && BYPASS_CORS === "1"),
  // required for Live Apps integration (usage of <webview> in PlatformAPIWebview.tsx)
  webviewTag: true,
  // allow devtools to exists in development mode or when explicitly enabled with DEV_TOOLS env var
  devTools: !!(__DEV__ || DEV_TOOLS),
  // Allow to use nodejs in renderer thread.
  nodeIntegration: true, // FIXME https://ledgerhq.atlassian.net/browse/LIVE-10304
  // disable the context isolation in order to be able to use "electron" on preloader/renderer side
  contextIsolation: false,
  // globally disable spellchecks which aren't useful to us & problematic for crypto address fields & so on
  spellcheck: false, // FIXME we should overrides this directly on the input fields instead of globally disabling it
};

const defaultWindowOptions = {
  icon: path.join(__dirname, "/build/icons/icon.png"),
  backgroundColor: "#fff",
  webPreferences,
};

export const loadWindow = async () => {
  const url = __DEV__ ? INDEX_URL : path.join("file://", __dirname, "index.html");
  if (mainWindow) {
    /** Making the following variables easily accessible to the renderer thread:
     * - theme
     * - appLocale, cf. https://www.electronjs.org/fr/docs/latest/api/app#appgetlocale
     * */
    const fullUrl = new URL(url);
    fullUrl.searchParams.append("appDirname", app.dirname || "");
    fullUrl.searchParams.append("theme", theme || "");
    fullUrl.searchParams.append("appLocale", app.getLocale());
    fullUrl.searchParams.append("pathUserdata", app.getPath("userData"));
    fullUrl.searchParams.append("pathHome", app.getPath("home"));
    await mainWindow.loadURL(fullUrl.href);
  }
};

export async function createMainWindow(
  {
    dimensions,
    positions,
  }: { dimensions?: { width: number; height: number }; positions?: { x: number; y: number } },
  settings: { theme: typeof theme },
) {
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
          titleBarStyle: "hiddenInset" as const,
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

  mainWindow.name = "MainWindow";
  loadWindow();
  if (DEV_TOOLS && !DISABLE_DEV_TOOLS) {
    mainWindow.webContents.on("did-frame-finish-load", () => {
      if (mainWindow) {
        mainWindow.webContents.once("devtools-opened", () => {
          mainWindow && mainWindow.focus();
        });
        mainWindow.webContents.openDevTools();
      }
    });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}
