import type { IntentDefinition } from "@ledgerhq/device-intent";

/**
 * Terminal RFQ status reported by the swap-api `/swap/status` endpoint.
 *
 * Mirrors the live-app `pollSwapStatusUntilComplete` discriminant: an
 * RFQ order is considered done when it reaches either `finished` (the
 * partner filled it on chain) or `refunded` (the partner could not
 * fill within the auction window and refunded the user).
 */
export type SubmitRfqOrderTerminalStatus = "finished" | "refunded";

/**
 * Discriminated union of states emitted by {@link submitRfqOrderEvmJob}.
 *
 * The job has no device interaction — it posts the signed order to the
 * partner's `/{provider}/submit` endpoint and polls `/swap/status` until
 * the RFQ reaches a terminal status. Errors are surfaced as a terminal
 * `failed` value so the orchestrator can react in `onIntentJobComplete`.
 */
export type SubmitRfqOrderEvmJobState =
  | { type: "submitting" }
  | { type: "submitted"; orderId: string }
  | { type: "polling"; orderId: string; pollCount: number }
  | {
      type: "confirmed";
      orderId: string;
      status: SubmitRfqOrderTerminalStatus;
      txHash?: string;
      swapId?: string;
      finalAmount?: string;
    }
  | { type: "failed"; error: Error };

/**
 * Input passed to {@link submitRfqOrderEvmJob} at runtime.
 *
 * - `provider` selects the swap-api submit endpoint (`/{provider}/submit`).
 * - `submitBody` is the JSON body posted to the submit endpoint, already
 *   built by the planner / orchestrator (so the wallet-side job stays
 *   provider-agnostic). It typically spreads the quote's `customFields`
 *   bag — with provider-specific overrides like UniswapX's
 *   `routing: "DUTCH_V2"` — and appends `signature`.
 * - `precomputedOrderId` is used when the order id is known from the
 *   quote itself (1inch Fusion ships it as `customFields.quoteResponse.orderHash`).
 *   When set, the job skips the submit-response `orderId` lookup.
 * - `network` is forwarded to the `/swap/status` body so the swap-api
 *   can route the lookup to the right chain (`ethereum`, `polygon`, …).
 */
export type SubmitRfqOrderEvmIntentInput = {
  provider: string;
  submitBody: Record<string, unknown>;
  precomputedOrderId?: string;
  network: string;
  /**
   * Override hooks. Tests inject these to avoid hitting the real swap-api
   * without having to monkey-patch global `fetch`. Production callers
   * leave them undefined so the job uses the package defaults.
   */
  fetchImpl?: typeof fetch;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  /** Swap-api base URL. Defaulted from {@link getSwapAPIBaseURL} when omitted. */
  swapApiBaseURL?: string;
};

export type SubmitRfqOrderEvmIntentDefinition = IntentDefinition<
  SubmitRfqOrderEvmJobState,
  SubmitRfqOrderEvmIntentInput
>;
