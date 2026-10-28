import { ipcRenderer, type IpcRendererEvent } from "electron";
import {
  CHANNELS,
  type DeeplinkBridge,
  type UpdaterBridge,
  type UpdaterStatusEvent,
  type Unsubscribe,
  type WebviewBridge,
  type WebviewBridgeMessage,
} from "~/bridge/contract";
import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";

// Drops the event: its `sender` is a privileged WebContents that must not cross the bridge.
function subscribe<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

export const updater: UpdaterBridge = {
  init: () => ipcRenderer.send(CHANNELS.updater, "init"),
  quitAndInstall: () => ipcRenderer.send(CHANNELS.updater, "quit-and-install"),
  onStatus: (callback: (event: UpdaterStatusEvent) => void) =>
    subscribe<UpdaterStatusEvent>(CHANNELS.updater, callback),
};

export const deeplink: DeeplinkBridge = {
  open: (url: string) => ipcRenderer.send(CHANNELS.deepLinking, url),
  onOpen: (callback: (url: string) => void) => subscribe<string>(CHANNELS.deepLinking, callback),
};

export const webview: WebviewBridge = {
  onDomainCheckViolation: (callback: (violation: DomainCheckViolation) => void) =>
    subscribe<DomainCheckViolation>(CHANNELS.webviewDomainCheckViolation, callback),
  onMessage: (callback: (message: WebviewBridgeMessage) => void) =>
    subscribe<WebviewBridgeMessage>(CHANNELS.webviewBridgeMessage, callback),
};
