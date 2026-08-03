import { setTransactionObserver, toSegmentTrackEvent } from "@ledgerhq/transaction-observability";
import { track } from "./segment";

// Forward every transaction (sign/broadcast) log event from the bridge seam to
// Segment/Mixpanel. Additive — the Datadog path (useBroadcast → broadcastLogger) is
// untouched. `track` self-gates on analytics consent, so no extra gating is needed.
setTransactionObserver(event => {
  const mapped = toSegmentTrackEvent(event);
  if (mapped) track(mapped.event, mapped.properties);
});
