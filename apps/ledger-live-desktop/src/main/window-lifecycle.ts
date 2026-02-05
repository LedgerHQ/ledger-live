import { BrowserWindow, screen, app, WebPreferences, WebContents } from "electron";
import path from "path";
import { delay } from "@ledgerhq/live-common/promise";
import { URL, pathToFileURL } from "url";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { intFromEnv, MIN_HEIGHT, MIN_WIDTH } from "~/config/windowConstants";

export const DEFAULT_WINDOW_WIDTH = intFromEnv("LEDGER_DEFAULT_WINDOW_WIDTH", 1024);
export const DEFAULT_WINDOW_HEIGHT = intFromEnv("LEDGER_DEFAULT_WINDOW_HEIGHT", 768);
export { MIN_HEIGHT, MIN_WIDTH };
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
  const url = __DEV__ ? INDEX_URL : pathToFileURL(path.join(__dirname, "index.html")).href;
  if (mainWindow) {
    /** Making the following variables easily accessible to the renderer thread:
     * - theme
     * - appLocale, cf. https://www.electronjs.org/fr/docs/latest/api/app#appgetlocale
     * */
    const fullUrl = new URL(url);
    fullUrl.searchParams.append("appDirname", app.dirname || "");
    fullUrl.searchParams.append("theme", theme || "");
    fullUrl.searchParams.append("appLocale", app.getLocale());
    fullUrl.searchParams.append("systemLocale", app.getSystemLocale());

    await mainWindow.loadURL(fullUrl.href);
  }
};

function restorePosition(
  previousPosition?: { x: number; y: number },
  previousDimensions?: { width: number; height: number },
) {
  let width = DEFAULT_WINDOW_WIDTH;
  let height = DEFAULT_WINDOW_HEIGHT;
  let x, y;
  if (previousDimensions) {
    width = previousDimensions.width;
    height = previousDimensions.height;
  }
  if (previousPosition) {
    x = previousPosition.x;
    y = previousPosition.y;
  } else {
    const windowPosition = getWindowPosition(width, height);
    x = windowPosition.x;
    y = windowPosition.y;
  }

  const bounds = { x, y, width, height };

  const area = screen.getDisplayMatching(bounds).workArea;

  // If the saved position still valid (the window is entirely inside the display area), use it.
  if (
    bounds.x >= area.x &&
    bounds.y >= area.y &&
    bounds.x + bounds.width <= area.x + area.width &&
    bounds.y + bounds.height <= area.y + area.height
  ) {
    x = bounds.x;
    y = bounds.y;
  } else {
    // If the saved position is not valid, move the window to the primary display.
    const primaryDisplay = screen.getPrimaryDisplay().workArea;
    x = primaryDisplay.x;
    y = primaryDisplay.y;
  }
  // If the saved size is still valid, use it.
  if (bounds.width <= area.width || bounds.height <= area.height) {
    width = bounds.width;
    height = bounds.height;
  }

  return { x, y, width, height };
}

/**
 * Creates the main window early without position/dimension parameters
 * This allows faster startup by deferring DB-dependent positioning
 */
export function createEarlyMainWindow() {
  if (mainWindow) {
    return mainWindow;
  }

  const windowOptions = {
    ...defaultWindowOptions,
    // Use default position/dimensions for now
    ...getWindowPosition(DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT),
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    ...(process.platform === "darwin"
      ? {
          frame: false,
          titleBarStyle: "hiddenInset" as const,
        }
      : {}),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false, // Keep hidden until fully configured
    webPreferences: {
      preload: path.join(__dirname, "preloader.bundle.js"),
      ...defaultWindowOptions.webPreferences,
    },
  };
  mainWindow = new BrowserWindow(windowOptions);

  setupMainWindowHandlers();
  mainWindow.name = "MainWindow";
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * Sets up the main window session handlers and device permissions
 */
function setupMainWindowHandlers() {
  if (!mainWindow) return;

  mainWindow.webContents.session.on("select-hid-device", (event, details, callback) => {
    event.preventDefault();
    const ledgerDevices = details.deviceList.filter(
      device => device.vendorId === ledgerUSBVendorId,
    );
    if (ledgerDevices.length > 0) {
      callback(ledgerDevices[0].deviceId);
    } else {
      console.warn("No Ledger HID devices found.");
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((_, permission) => {
    if (permission === "hid") return true;
    return false;
  });

  mainWindow.webContents.session.setDevicePermissionHandler(details => {
    if (details.deviceType === "hid" && details.device.vendorId === 0x2c97) {
      return true;
    }
    return false;
  });

  // Track and clean up a webview's DevTools WebContents to avoid orphaned DevTools windows.
  mainWindow.webContents.on("did-attach-webview", function (_event, webContents) {
    let devtoolContents: WebContents | null = null;
    webContents.on("devtools-opened", () => {
      devtoolContents = webContents.devToolsWebContents;
      devtoolContents?.on("destroyed", () => {
        devtoolContents = null;
      });
    });

    webContents.on("destroyed", () => {
      devtoolContents?.close();
    });
  });

  if (__DEV__) {
    const setUserAgent = (webContents: Electron.WebContents) => {
      webContents.setUserAgent(`${webContents.getUserAgent()} LedgerLive/${__APP_VERSION__}`);
    };
    setUserAgent(mainWindow.webContents);
    mainWindow.webContents.on("did-attach-webview", function (_event, webContents) {
      setUserAgent(webContents);
    });
  }
}

/**
 * Applies window parameters (position, dimensions, theme) and loads the window content
 */
export async function applyWindowParams(
  {
    dimensions,
    positions,
  }: { dimensions?: { width: number; height: number }; positions?: { x: number; y: number } },
  settings: { theme: typeof theme },
) {
  if (!mainWindow) {
    throw new Error("Main window must be created first with createEarlyMainWindow()");
  }

  theme =
    settings && settings.theme && ["light", "dark"].includes(settings.theme)
      ? settings.theme
      : "null";

  // Apply saved position and dimensions
  const { x, y, width, height } = restorePosition(positions, dimensions);
  mainWindow.setBounds({ x, y, width, height });

  console.time("T-load");
  await loadWindow();
  console.timeEnd("T-load");

  // Start timing the portion after loadWindow until ready-to-show
  console.time("T-ready");

  // Setup dev tools if needed (non-blocking)
  if (DEV_TOOLS && !DISABLE_DEV_TOOLS) {
    const openDevTools = () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.once("devtools-opened", () => {
          if (mainWindow) mainWindow.focus();
        });
        mainWindow.webContents.openDevTools();
      }
    };

    // Try to open dev tools when the frame finishes loading
    mainWindow.webContents.on("did-frame-finish-load", openDevTools);

    // Also try to open dev tools when the window is shown
    mainWindow.on("show", openDevTools);
  }
}
