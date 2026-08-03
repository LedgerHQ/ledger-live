import { ipcRenderer } from "electron";
import {
  CHANNELS,
  type Bootstrap,
  type CardSessionBridge,
  type LedgerBridge,
} from "~/bridge/contract";
import { expose } from "./expose";
import { db } from "./db";
import { transport } from "./transport";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

export function installBridge(): void {
  const bootstrap = ipcRenderer.sendSync(CHANNELS.bootstrap) as Bootstrap;

  let cardSessionTaken = false;
  const cardSession: CardSessionBridge = {
    takeBootstrap: () => {
      if (cardSessionTaken) return Promise.resolve(null);
      cardSessionTaken = true;
      return ipcRenderer.invoke(CHANNELS.cardSessionBootstrap);
    },
  };

  const bridge: LedgerBridge = {
    version: 1,
    // Consumers that mutate it (the `process.env` shim) take a copy.
    bootstrap: deepFreeze(bootstrap),
    db,
    transport,
    cardSession,
  };

  // Not `ledger`: the E2E suites already use `window.ledger`.
  expose("lld", bridge);
}
