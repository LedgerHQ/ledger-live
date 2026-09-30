import { setZCashIpcRenderer } from "@ledgerhq/coin-zcash/network/ZCashIPC";
import { zcash } from "~/renderer/bridge";

type ZcashListener = (event: unknown, payload: unknown) => void;

// coin-zcash removes listeners by identity, which the bridge cannot support.
const disposers = new WeakMap<ZcashListener, () => void>();

export function setupZCashIpc(): void {
  setZCashIpcRenderer({
    invoke: (channel: string, args: unknown) => zcash.invoke(channel, args),

    on: (channel: string, listener: ZcashListener) => {
      // coin-zcash expects Electron's (event, payload) signature.
      const unsubscribe = zcash.subscribe(channel, payload => listener(undefined, payload));
      disposers.set(listener, unsubscribe);
    },

    removeListener: (_channel: string, listener: ZcashListener) => {
      disposers.get(listener)?.();
      disposers.delete(listener);
    },
  });
}
