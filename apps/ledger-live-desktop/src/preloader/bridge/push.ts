import { ipcRenderer, type IpcRendererEvent } from "electron";
import {
  CHANNELS,
  type DeeplinkBridge,
  type UpdaterBridge,
  type UpdaterStatusEvent,
  type Unsubscribe,
} from "~/bridge/contract";

/**
 * Subscribes to a main-process push channel, dropping the `IpcRendererEvent`: it carries a
 * `sender` — a privileged `WebContents` — which would either fail the bridge's conversion or
 * arrive as a mangled shell of a privileged object.
 *
 * Cancellation returns a closure rather than taking the listener back; see `Unsubscribe`.
 */
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
