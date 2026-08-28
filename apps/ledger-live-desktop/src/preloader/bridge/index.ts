import { ipcRenderer } from "electron";
import { CHANNELS, type Bootstrap, type LedgerBridge } from "~/bridge/contract";
import { expose } from "./expose";
import { db } from "./db";
import { transport } from "./transport";
import { deeplink, updater } from "./push";
import { app, files, power, store } from "./shell";
import { shell, system } from "./system";
import { zcash } from "./zcash";

/**
 * Assembles and publishes the bridge. The preload is fully executed before the renderer
 * bundle, which is what lets renderer modules read bootstrap values at module scope.
 */
export function installBridge(): void {
  const bootstrap = ipcRenderer.sendSync(CHANNELS.bootstrap) as Bootstrap;

  const bridge: LedgerBridge = {
    version: 1,
    // Frozen: it is a snapshot of main's state. Consumers that mutate must take a copy.
    bootstrap: Object.freeze(bootstrap),
    db,
    transport,
    updater,
    deeplink,
    app,
    files,
    power,
    store,
    shell,
    system,
    zcash,
  };

  // `lld`, not `ledger`: the renderer already installs a `window.ledger` debug handle for
  // the E2E suites.
  expose("lld", bridge);
}
