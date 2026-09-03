import { setTransactionObserver, toSegmentTrackEvent } from "@ledgerhq/transaction-observability";
import { track } from "./segment";

/**
 * Forwards every transaction (sign/broadcast) log event from the bridge seam to
 * Segment/Mixpanel. Additive — the Datadog path (useBroadcast → broadcastLogger) is
 * untouched. `track` self-gates on analytics consent, so no extra gating is needed here.
 *
 * Registered at module load, like mobile's equivalent: the bridge is resolved through the
 * global `getAccountBridge` rather than React context, so there is nothing to hang it off.
 */
setTransactionObserver(event => {
  const mapped = toSegmentTrackEvent(event);
  if (mapped) track(mapped.event, mapped.properties);
});

// Dev-only: makes the whole seam visible locally, across every staking route and coin.
if (process.env.NODE_ENV !== "production") {
  setTransactionObserver(event => {
    // eslint-disable-next-line no-console
    console.log(`[tx-observability] ${event.stage}/${event.status}`, {
      pathway: event.pathway,
      currencyId: event.currencyId,
      rawTransactionType: event.rawTransactionType,
      earnTransactionType: event.earnTransactionType,
      dataSource: event.dataSource,
      // Attribution belongs on both outcomes: a sign event is always a failure, so reporting
      // the manifest only on success hid it for exactly the dApp case.
      manifestId: event.manifestId,
      stakingMethod: event.stakingMethod,
      dappContract: event.dappContract,
      outputCurrency: event.outputCurrency,
      ...(event.status === "failure"
        ? { errorCategory: event.errorCategory, errorName: event.error.name }
        : { validators: event.validators }),
    });
  });
}
