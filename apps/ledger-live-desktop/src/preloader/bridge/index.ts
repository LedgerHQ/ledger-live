import { ipcRenderer } from "electron";
import { CHANNELS, type Bootstrap, type LedgerBridge } from "~/bridge/contract";
import { expose } from "./expose";
import { db } from "./db";
import { transport } from "./transport";
import { deeplink, updater } from "./push";
import { app, dialogs, files, power, store } from "./shell";
import { shell, system } from "./system";
import { zcash } from "./zcash";

/**
 * Assembles and publishes the `window.ledger` bridge.
 *
 * Must run before the renderer bundle evaluates, which it does: the preload is fully
 * executed first. That ordering is what allows renderer modules to read bootstrap values
 * synchronously at module scope.
 */
export function installBridge(): void {
  const bootstrap = ipcRenderer.sendSync(CHANNELS.bootstrap) as Bootstrap;

  const bridge: LedgerBridge = {
    version: 1,
    // Frozen so renderer code cannot mutate what is meant to be a snapshot of main's
    // state. Consumers that need to mutate (the `process.env` shim) must take a copy.
    bootstrap: Object.freeze(bootstrap),
    db,
    transport,
    updater,
    deeplink,
    app,
    dialogs,
    files,
    power,
    store,
    shell,
    system,
    zcash,
  };

  // `lld`, not `ledger`: the renderer already installs a `window.ledger` debug handle for
  // the E2E suites, and clobbering it would break them.
  expose("lld", bridge);
}
