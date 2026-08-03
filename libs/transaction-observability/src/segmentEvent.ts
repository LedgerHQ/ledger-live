import type { LogEvent } from "./logEvent";

export type SegmentTrackEvent = {
  event: string;
  properties: Record<string, unknown>;
};

// Distinct event names per lifecycle point — kept separate from the existing
// `WalletAPI …` / `Platform …` / `dApp …` events so they don't double-count.
const EVENT_NAMES: Record<string, string> = {
  "started:sign": "Transaction Sign Started",
  "failure:sign": "Transaction Sign Failed",
  "success:broadcast": "Transaction Broadcast Success",
  "failure:broadcast": "Transaction Broadcast Failed",
};

/**
 * Maps a transaction {@link LogEvent} to a Segment/Mixpanel `track` call.
 *
 * Returns `null` for combinations we don't emit an event for (so the observer can skip).
 * Deliberately omits the raw `error` object and `txPayload.signature` — no raw signatures
 * in product analytics; failure reason is conveyed by `errorCategory` + `errorName`.
 */
export function toSegmentTrackEvent(event: LogEvent): SegmentTrackEvent | null {
  const name = EVENT_NAMES[`${event.status}:${event.stage}`];
  if (!name) return null;

  const properties: Record<string, unknown> = {
    flow: event.flow,
    stage: event.stage,
    currencyId: event.currencyId,
    family: event.family,
    isTestnet: event.isTestnet,
    isSendMax: event.isSendMax,
    ...(event.productFlow ? { productFlow: event.productFlow } : {}),
    ...(event.tokenId ? { tokenId: event.tokenId } : {}),
    ...(event.transactionType ? { transactionType: event.transactionType } : {}),
    ...(event.validators?.length ? { validators: event.validators } : {}),
    ...(event.manifestId ? { manifestId: event.manifestId } : {}),
  };

  if (event.status === "failure") {
    properties.errorCategory = event.errorCategory;
    properties.errorName = event.error.name;
  }

  return { event: name, properties };
}
