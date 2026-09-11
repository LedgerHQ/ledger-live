import type { LogEvent } from "./logEvent";
import { isStakingApp } from "./stakingApps";

export type SegmentTrackEvent = {
  event: string;
  properties: Record<string, unknown>;
};

// Same names and vocabulary as the Earn live-app emits, so both sides of the funnel join in
// Mixpanel. `stage` carries where in the lifecycle the outcome happened.
const EARN_TRANSACTION_COMPLETED = "earn_transaction_completed";
const EARN_TRANSACTION_FAILED = "earn_transaction_failed";

// The Earn live-app emits earn_transaction_* for its own wallet-api flows with richer
// context (protocol, receipt token). Emitting here too would double-count.
const APP_OWNED_MANIFEST_IDS = new Set(["earn", "earn-stg", "earn-prd-eks"]);

// Reported instead of an action when a staking app calls an unmapped function.
const UNMAPPED_ACTION = "unknown";

/**
 * Maps a transaction {@link LogEvent} to a Segment/Mixpanel `track` call, or `null` when the
 * event does not belong in the earn funnel.
 *
 * Deliberately omits the raw `error` object and `txPayload.signature` — no raw signatures or
 * error messages in product analytics; the failure reason is carried by `error_category` and
 * `error_reason`.
 */
export function toSegmentTrackEvent(event: LogEvent): SegmentTrackEvent | null {
  // The bridge seam sees every transaction, including plain sends and swaps. Two things put
  // one in the earn funnel: a recognised staking action, or a transaction inside an app whose
  // whole purpose is staking. The second arm is what admits dApp contract calls, whose action
  // is only as good as the selector map — see `transaction_type` below.
  if (!event.earnTransactionType && !isStakingApp(event.manifestId)) return null;
  if (event.manifestId && APP_OWNED_MANIFEST_IDS.has(event.manifestId)) return null;

  const isSuccess = event.status === "success";
  const properties: Record<string, unknown> = {
    // Ledger Wallet's own staking events already say "stake" (screens/stake/constants, the
    // family StepConfirmations), so the seam speaks its host's vocabulary rather than the
    // Earn live-app's "earn". The two halves of the funnel join on the event name.
    //
    // Unreliable on mobile until LIVE-35904: `segment.ts` spreads its extra properties after
    // the event's, and those set flow=onboarding|post-onboarding while those selectors are true.
    flow: "stake",
    stage: event.stage,
    status: isSuccess ? "success" : "failed",
    // `unknown` means a staking app called something the selector map does not cover. The
    // transaction still counts — dropping it would hide real funnel volume — and
    // `raw_transaction_type` carries the selector, so the next mapping is obvious.
    transaction_type: event.earnTransactionType ?? UNMAPPED_ACTION,
    raw_transaction_type: event.rawTransactionType,
    // The asset the user recognises, plus the chain it settles on.
    input_currency: (event.tokenTicker ?? event.currencyTicker).toLowerCase(),
    network: event.currencyId,
    family: event.family,
    // Technical route (native send, wallet-api, dApp) — distinct from the `flow` above,
    // which is the product funnel.
    tx_pathway: event.pathway,
    // Whether the broadcast event reused the sign stage's richer data. Reported so the
    // correlation hit-rate is measurable rather than assumed.
    tx_data_source: event.dataSource,
    is_testnet: event.isTestnet,
    is_send_max: event.isSendMax,
    // The live-app or dApp that originated the transaction. Named `manifest_id` rather than
    // `provider` because a manifest id is the app, not the staking provider behind it.
    ...(event.manifestId ? { manifest_id: event.manifestId } : {}),
    ...(event.stakingMethod ? { staking_method: event.stakingMethod } : {}),
    // A staking contract is public infrastructure and identical for every user, so it is safe
    // to report — and it is what tells us which contracts we have yet to map.
    ...(event.dappContract ? { contract_address: event.dappContract } : {}),
    ...(event.outputCurrency ? { output_currency: event.outputCurrency } : {}),
    ...(event.validators?.length ? { validators: event.validators } : {}),
  };

  if (!isSuccess) {
    properties.error_category = event.errorCategory;
    properties.error_reason = event.error.name;
  }

  return {
    event: isSuccess ? EARN_TRANSACTION_COMPLETED : EARN_TRANSACTION_FAILED,
    properties,
  };
}
