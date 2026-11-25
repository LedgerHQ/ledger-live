import { setCoinModuleCallObserver } from "@features/platform-coin-observability";
import { setOperationSink } from "@shared/observability-operations";
import { setTransactionObserver } from "@ledgerhq/transaction-observability";
import {
  coinModuleCallLogger,
  isDatadogEnabled,
  scrubTrackedRequestUrls,
  transactionBroadcastLogger,
} from "./datadog";
import { datadogOperationSink } from "./datadogOperationSink";

/**
 * Forwards coin-module calls and bridge-seam broadcast outcomes to Datadog logs. Registered at
 * module load, next to the Segment transaction observer, for the same reason: both sources are
 * global registries resolved outside React.
 */
setCoinModuleCallObserver(coinModuleCallLogger);
setTransactionObserver(transactionBroadcastLogger);
setOperationSink(datadogOperationSink);

if (isDatadogEnabled) scrubTrackedRequestUrls();
