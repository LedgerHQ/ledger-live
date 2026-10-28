import { ipcRenderer, type IpcRendererEvent } from "electron";
import type { Unsubscribe } from "~/bridge/contract";

// Drops the event: its `sender` is a privileged WebContents that must not cross the bridge.
export function subscribe<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const listener = (_event: IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}
