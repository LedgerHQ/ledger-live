import { app, BrowserWindow, session } from "electron";
import { getMainWindow } from "./window-lifecycle";
import {
  isMeshConnectUrl,
  isMeshPayOAuthFrameUrl,
  isMeshPayPopupUrl,
  stripMeshEmbedRestrictions,
} from "./meshPayWebview.helpers";

type MeshPayGlobal = typeof globalThis & {
  __ledgerLiveMeshPaySetup__?: boolean;
};

const meshPayGlobal = globalThis as MeshPayGlobal;

const MESH_PAY_POPUP_WINDOW_OPTIONS = {
  width: 480,
  height: 720,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    webviewTag: false,
  },
} as const;

function createMeshPayPopupHandler() {
  return ({ url }: Electron.HandlerDetails): Electron.WindowOpenHandlerResponse => {
    if (!isMeshPayPopupUrl(url)) {
      return { action: "deny" };
    }

    return {
      action: "allow",
      overrideBrowserWindowOptions: MESH_PAY_POPUP_WINDOW_OPTIONS,
    };
  };
}

function openMeshPayOAuthPopup(url: string) {
  const parent = getMainWindow();
  const popup = new BrowserWindow({
    ...MESH_PAY_POPUP_WINDOW_OPTIONS,
    parent: parent && !parent.isDestroyed() ? parent : undefined,
    modal: false,
    show: true,
  });

  popup.webContents.setWindowOpenHandler(createMeshPayPopupHandler());
  popup.loadURL(url);
}

export function configureMeshPayHost(contents: Electron.WebContents) {
  contents.setWindowOpenHandler(createMeshPayPopupHandler());

  const redirectOAuthFramesToPopup = (
    event: Electron.Event<Electron.WebContentsWillFrameNavigateEventParams>,
  ) => {
    if (!isMeshPayOAuthFrameUrl(event.url)) return;

    event.preventDefault();
    openMeshPayOAuthPopup(event.url);
  };

  contents.on("will-frame-navigate", redirectOAuthFramesToPopup);

  contents.on("did-create-window", (window: BrowserWindow) => {
    window.webContents.setWindowOpenHandler(createMeshPayPopupHandler());
  });
}

function registerMeshConnectHeaderStripping() {
  const onHeadersReceived = (
    details: Electron.OnHeadersReceivedListenerDetails,
    callback: (response: Electron.HeadersReceivedResponse) => void,
  ) => {
    if (!isMeshConnectUrl(details.url)) {
      callback({});
      return;
    }

    callback({
      responseHeaders: stripMeshEmbedRestrictions(details.responseHeaders),
    });
  };

  session.defaultSession.webRequest.onHeadersReceived(onHeadersReceived);
  app.on("session-created", createdSession => {
    createdSession.webRequest.onHeadersReceived(onHeadersReceived);
  });
}

export function setupMeshPayWebviewHandlers() {
  if (meshPayGlobal.__ledgerLiveMeshPaySetup__) {
    return;
  }
  meshPayGlobal.__ledgerLiveMeshPaySetup__ = true;

  registerMeshConnectHeaderStripping();

  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    configureMeshPayHost(mainWindow.webContents);
  }
}
