import {
  clearPendingTxLifecycle,
  sendTxLifecycle,
  setTransactionObserver,
  toSegmentTrackEvent,
  toTxLifecyclePayload,
} from "@ledgerhq/transaction-observability";
import { isEarnTxLifecycleMonitoringEnabled } from "./earnTxLifecycleFlag";
import { track } from "./segment";

/**
 * Forwards every transaction (sign/broadcast) log event from the bridge seam to
 * Segment/Mixpanel. Additive — the Datadog path (useBroadcast → broadcastLogger) is
 * untouched. `track` self-gates on analytics consent, so no extra gating is needed here.
 */
setTransactionObserver(event => {
  const mapped = toSegmentTrackEvent(event);
  if (mapped) track(mapped.event, mapped.properties);
});

setTransactionObserver(event => {
  if (!isEarnTxLifecycleMonitoringEnabled()) {
    clearPendingTxLifecycle("mobile");
    return;
  }
  const payload = toTxLifecyclePayload(event, "mobile");
  if (!payload) return;

  if (event.manifestId) {
    sendTxLifecycle(payload, event.manifestId);
  } else {
    sendTxLifecycle(payload);
  }
});
