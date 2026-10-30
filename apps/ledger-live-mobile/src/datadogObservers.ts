import { setCoinModuleCallObserver } from "@features/platform-coin-observability";
import { setTransactionObserver } from "@ledgerhq/transaction-observability";
import { coinModuleCallLogger, transactionBroadcastLogger } from "./datadog";

/**
 * Forwards coin-module calls and bridge-seam broadcast outcomes to Datadog logs. Registered at
 * module load, next to the Segment transaction observer, for the same reason: both sources are
 * global registries resolved outside React.
 */
setCoinModuleCallObserver(coinModuleCallLogger);
setTransactionObserver(transactionBroadcastLogger);
