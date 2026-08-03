import { ipcRenderer } from "electron";
import { CHANNELS, type TransportBridge } from "~/bridge/contract";

/**
 * `open` no longer forwards its `TraceContext`: the main handler ignores it, and an
 * arbitrary object of that shape is not guaranteed to survive the bridge's conversion.
 */
export const transport: TransportBridge = {
  open: (requestId: string, descriptor: string, timeout?: number) =>
    ipcRenderer.invoke(CHANNELS.transportOpen, { requestId, descriptor, timeout }),

  exchange: (requestId: string, apduHex: string, timeout?: number) =>
    ipcRenderer.invoke(CHANNELS.transportExchange, { requestId, apdu: apduHex, timeout }),

  close: (requestId: string) => ipcRenderer.invoke(CHANNELS.transportClose, { requestId }),

  listen: (requestId: string) => ipcRenderer.invoke(CHANNELS.transportListen, { requestId }),

  listenUnsubscribe: (requestId: string) =>
    ipcRenderer.invoke(CHANNELS.transportListenUnsubscribe, { requestId }),
};
