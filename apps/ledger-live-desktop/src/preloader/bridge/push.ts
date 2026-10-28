import { ipcRenderer } from "electron";
import {
  CHANNELS,
  type DeeplinkBridge,
  type UpdaterBridge,
  type UpdaterStatusEvent,
  type WebviewBridge,
  type WebviewBridgeMessage,
} from "~/bridge/contract";
import type { DomainCheckViolation } from "@ledgerhq/live-common/wallet-api/manifestDomainReport";
import { subscribe } from "./subscribe";

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
