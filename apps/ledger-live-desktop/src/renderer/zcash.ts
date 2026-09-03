import { setZCashIpcRenderer } from "@ledgerhq/coin-zcash/network/ZCashIPC";
import { zcash } from "~/renderer/bridge";

type ZcashListener = (event: unknown, payload: unknown) => void;

/**
 * `@ledgerhq/coin-zcash` removes its stream listener by identity, which the bridge cannot
 * support. Holding the disposer here keeps the library's contract working unchanged.
 */
const disposers = new WeakMap<ZcashListener, () => void>();

/** Installs the IPC channel ZCash shielded sync talks over. Called once during startup. */
export function setupZCashIpc(): void {
  setZCashIpcRenderer({
    invoke: (channel: string, args: unknown) => zcash.invoke(channel, args),

    on: (channel: string, listener: ZcashListener) => {
      // The library still expects Electron's (event, payload) signature; the preload has
      // already stripped the event.
      const unsubscribe = zcash.subscribe(channel, payload => listener(undefined, payload));
      disposers.set(listener, unsubscribe);
    },

    removeListener: (_channel: string, listener: ZcashListener) => {
      disposers.get(listener)?.();
      disposers.delete(listener);
    },
  });
}
