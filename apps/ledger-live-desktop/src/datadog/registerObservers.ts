import { setCoinModuleCallObserver } from "@features/platform-coin-observability";
import { log } from "@ledgerhq/logs";
import { setTransactionObserver } from "@ledgerhq/transaction-observability";
import { coinModuleCallLogger, transactionBroadcastLogger } from "./logs";

/**
 * Forwards coin-module calls and bridge-seam broadcast outcomes to Datadog logs.
 *
 * Registered at module load, like the Segment transaction observer: both sources are global
 * registries, since the bridge and the coin-module are resolved outside React. The loggers stay
 * no-ops until Datadog logs are initialised, which is gated on the crash-reporting opt-in and
 * the `lldDatadog` flag.
 */
setCoinModuleCallObserver(coinModuleCallLogger);
setTransactionObserver(transactionBroadcastLogger);

// Every call, unsampled, in the local logs: printed with `VERBOSE=1` or `VERBOSE=coin-module-call`,
// and part of the logs a user exports. Nothing here leaves the device.
setCoinModuleCallObserver(event => {
  log("coin-module-call", `${event.family}/${event.method} ${event.status}`, {
    network: event.network,
    durationMs: event.durationMs,
    ...(event.errorName ? { errorName: event.errorName, errorCategory: event.errorCategory } : {}),
  });
});
