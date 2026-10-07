import { ipcRenderer } from "electron";
import {
  BRIDGE_VERSION,
  CHANNELS,
  type Bootstrap,
  type CardSessionBridge,
  type LedgerBridge,
} from "~/bridge/contract";
import { expose } from "./expose";
import { db } from "./db";
import { deeplink, updater } from "./push";
import { app, files, power, store } from "./shell";
import { shell, system } from "./system";

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
    version: BRIDGE_VERSION,
    bootstrap: deepFreeze(bootstrap),
    db,
    updater,
    deeplink,
    app,
    files,
    power,
    store,
    shell,
    system,
    cardSession,
  };

  // Not `ledger`: the E2E suites already use `window.ledger`.
  expose("lld", bridge);
}
