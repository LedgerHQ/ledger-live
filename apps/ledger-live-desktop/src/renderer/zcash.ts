import {
  createZCashClient as createZCashIPCClient,
  setZCashIpcRenderer,
  type IpcRendererLike,
  type ZCashIPCClientArgs,
} from "@ledgerhq/coin-zcash/network/ZCashIPC";
import type { ZCashClient } from "@ledgerhq/coin-zcash/network/types";
import { zcash } from "~/renderer/bridge";

type ZcashListener = (event: unknown, payload: unknown) => void;

const unsubscribeByListener = new WeakMap<ZcashListener, () => void>();

const ipcRenderer: IpcRendererLike = {
  invoke: (channel: string, args: unknown) => zcash.invoke(channel, args),

  on: (channel: string, listener: ZcashListener) => {
    const unsubscribe = zcash.subscribe(channel, payload => listener(undefined, payload));
    unsubscribeByListener.set(listener, unsubscribe);
  },

  removeListener: (_channel: string, listener: ZcashListener) => {
    unsubscribeByListener.get(listener)?.();
    unsubscribeByListener.delete(listener);
  },
};

/**
 * The renderer bundle aliases `@ledgerhq/coin-zcash/network/ZCash` here (see `rspack.renderer.ts`),
 * so the IPC client loads with ZCash's lazy chunk instead of at startup.
 */
export function createZCashClient(args: ZCashIPCClientArgs): ZCashClient {
  setZCashIpcRenderer(ipcRenderer);
  return createZCashIPCClient(args);
}
