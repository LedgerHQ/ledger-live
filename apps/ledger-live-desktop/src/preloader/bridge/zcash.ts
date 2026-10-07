import { ipcRenderer, type IpcRendererEvent } from "electron";
import { ZCASH_IPC } from "@ledgerhq/coin-zcash/network/ipc/contract";
import type { Unsubscribe, ZcashBridge } from "~/bridge/contract";

const ALLOWED = new Set<string>(Object.values(ZCASH_IPC));

function assertAllowed(channel: string) {
  if (!ALLOWED.has(channel)) {
    throw new Error(`ZCash bridge: refusing unknown channel "${channel}"`);
  }
}

export const zcash: ZcashBridge = {
  invoke: (channel: string, args: unknown) => {
    assertAllowed(channel);
    return ipcRenderer.invoke(channel, args);
  },

  subscribe: (channel: string, callback: (payload: unknown) => void): Unsubscribe => {
    assertAllowed(channel);
    const listener = (_event: IpcRendererEvent, payload: unknown) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
};
