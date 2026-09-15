import {
  sendTxLifecycle,
  setTransactionObserver,
  toSegmentTrackEvent,
  toTxLifecyclePayload,
} from "@ledgerhq/transaction-observability";
import { getFeature } from "@ledgerhq/live-common/firebase/featureFlags";
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
  if (!getFeature({ key: "earnTxLifecycleMonitoring" })?.enabled) return;
  const payload = toTxLifecyclePayload(event, "mobile");
  if (payload) sendTxLifecycle(payload);
});
