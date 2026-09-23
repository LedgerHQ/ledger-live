import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  EnergyRentOrder,
  EnergyRentStatus,
  SponsoredCoinApi,
} from "../../../bridge/generic-coin-framework/sponsored";
import { SPONSORED_FAILURE_KIND, SPONSORED_PHASE } from "./types";
import type { SponsoredState } from "./types";

export type UseSponsoredSendOrchestrationParams = Readonly<{
  network: string; // parent-chain currency id — NOT a token id
  kind: string; // bridge kind — "local" for a generic-coin-framework family
  // The send intent. craftRent derives the rent order from it via the seam's buildEnergyRentRequest
  // (which simulates the required energy on-chain), so the app doesn't estimate energy or read config.
  intent: unknown;
  pollOpts?: { intervalMs?: number; timeoutMs?: number };
  // Fired the moment TX-A is (possibly) broadcast — a clean submit, or a submit rejection that
  // reconciled to funds-moved/already-delivered — so the platform can lock the native rent against the
  // payer's balance. Deliberately invoked before the generation guards and independent of the phase
  // machine: the payer is charged whether or not this UI cycle is still current, so a reset/unmount
  // mid-submit must not lose the reservation. Not called for the definitively-unpaid outcome.
  onRentPaymentBroadcast?: (info: {
    paymentTxId?: string;
    payerAddress: string;
    payCoinAmt: string | number;
  }) => void;
}>;

export type SponsoredSendActions = Readonly<{
  craftRent: () => Promise<void>; // craft order, phase -> RENT_SIGNING
  // submit TX A + await delivery; paymentTxId is TX A's hash (known to the caller once signed),
  // carried so a delivery timeout can surface it for support/refund.
  startRentPayment: (signedTransaction: unknown, paymentTxId?: string) => Promise<void>;
  onTransferSuccess: () => void; // UI calls when TX C is broadcast — terminal DONE
  setContractDataFailure: (error: Error) => void; // UI calls on a device contract-data refusal
  onTransferError: (error: Error) => void; // UI calls when TX C fails after delivery
  retry: () => void; // reset to the correct step by failureKind
  reset: () => void; // back to IDLE
}>;

const initialState: SponsoredState = {
  phase: SPONSORED_PHASE.IDLE,
  order: null,
  payerAddress: null,
  receiverAddress: null,
  energyNeeded: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
  contractDataResumePhase: SPONSORED_PHASE.RENT_SIGNING,
};

type Action =
  | {
      type: "CRAFT_SUCCESS";
      order: EnergyRentOrder;
      payerAddress: string;
      receiverAddress: string;
      energyNeeded: bigint;
    }
  | { type: "CRAFT_FAILURE"; error: Error }
  | { type: "SUBMIT_FAILURE"; error: Error }
  | { type: "POLLING_START"; paymentTxId?: string }
  | { type: "DELIVERY_SUCCESS"; paymentTxId?: string }
  | { type: "DELIVERY_TIMEOUT"; error: Error & { paymentTxId?: string } }
  | { type: "DELIVERY_FAILURE"; error: Error; paymentTxId?: string }
  | { type: "TRANSFER_SUCCESS" }
  | { type: "CONTRACT_DATA_FAILURE"; error: Error }
  | { type: "TRANSFER_FAILURE"; error: Error }
  | { type: "RETRY" }
  | { type: "RESET" };

function reducer(state: SponsoredState, action: Action): SponsoredState {
  switch (action.type) {
    case "CRAFT_SUCCESS":
      return {
        ...state,
        phase: SPONSORED_PHASE.RENT_SIGNING,
        order: action.order,
        payerAddress: action.payerAddress,
        receiverAddress: action.receiverAddress,
        energyNeeded: action.energyNeeded,
        // Fresh order — drop any payment id carried from a prior (retried) craft cycle.
        paymentTxId: null,
        failureKind: null,
        failureError: null,
      };
    // Crafting the rent tx and submitting the signed rent payment are the same user situation on
    // failure: TX A never landed, so funds were not moved -> RENT_PAYMENT. Shared block.
    case "CRAFT_FAILURE":
    case "SUBMIT_FAILURE":
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.RENT_PAYMENT,
        failureError: action.error,
      };
    case "POLLING_START":
      return {
        ...state,
        phase: SPONSORED_PHASE.POLLING,
        paymentTxId: action.paymentTxId ?? state.paymentTxId,
      };
    case "DELIVERY_SUCCESS":
      // Carry the payment id so a submit rejection reconciled straight to "already delivered" (which
      // skips POLLING_START) still lands it on state — the native-TRX rent reservation keys off it.
      return {
        ...state,
        phase: SPONSORED_PHASE.TRANSFER,
        paymentTxId: action.paymentTxId ?? state.paymentTxId,
      };
    case "TRANSFER_SUCCESS":
      return {
        ...state,
        phase: SPONSORED_PHASE.DONE,
        failureKind: null,
        failureError: null,
      };
    case "DELIVERY_TIMEOUT":
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
        failureError: action.error,
        paymentTxId: action.error.paymentTxId ?? state.paymentTxId,
      };
    case "DELIVERY_FAILURE":
      // Funds moved (or may have): an explicit provider delivery failure, or a submit rejection that
      // reconciliation showed left the order paid/pending/unconfirmable. Either way "funds not moved"
      // (RENT_PAYMENT) would be wrong, so it lands on DELIVERY_FAILED (funds moved, contact support).
      // A submit-path failure carries its own paymentTxId (POLLING_START never ran); otherwise the one
      // set at POLLING_START survives the spread.
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
        failureError: action.error,
        paymentTxId: action.paymentTxId ?? state.paymentTxId,
      };
    case "CONTRACT_DATA_FAILURE":
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.CONTRACT_DATA,
        failureError: action.error,
        // Record where to resume from the live pre-failure phase: a contract-data refusal only ever
        // arrives while signing the rent tx (RENT_SIGNING) or the transfer (TRANSFER). Any other
        // phase is not a signing step, so treat it as rent-signing.
        contractDataResumePhase:
          state.phase === SPONSORED_PHASE.TRANSFER
            ? SPONSORED_PHASE.TRANSFER
            : SPONSORED_PHASE.RENT_SIGNING,
      };
    case "TRANSFER_FAILURE":
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.TRANSFER,
        failureError: action.error,
      };
    case "RETRY": {
      switch (state.failureKind) {
        case SPONSORED_FAILURE_KIND.RENT_PAYMENT:
        case SPONSORED_FAILURE_KIND.DELIVERY_FAILED:
          // A fresh craft is required (the previous order is stale/expired) — the rent-signature
          // screen re-crafts on entry.
          return {
            ...state,
            phase: SPONSORED_PHASE.RENT_SIGNING,
            order: null,
            // The prior payer, receiver, energy target and payment id belong to the stale order —
            // clear them with it so the re-craft repopulates them.
            payerAddress: null,
            receiverAddress: null,
            energyNeeded: null,
            paymentTxId: null,
            failureKind: null,
            failureError: null,
          };
        case SPONSORED_FAILURE_KIND.CONTRACT_DATA:
          // The order/delegation is untouched by a device refusal — resume at the step it failed
          // on (recorded on state at the moment of failure; see CONTRACT_DATA_FAILURE).
          return {
            ...state,
            phase: state.contractDataResumePhase,
            failureKind: null,
            failureError: null,
          };
        case SPONSORED_FAILURE_KIND.TRANSFER:
          // Delegation already succeeded; only TX C needs retrying.
          return {
            ...state,
            phase: SPONSORED_PHASE.TRANSFER,
            failureKind: null,
            failureError: null,
          };
        default:
          return state;
      }
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/**
 * One authoritative on-chain delivery read for the reconcile paths (the provider status is advisory,
 * never the gate — ADR-058 C4). A thrown read cannot confirm delivery, so it resolves false: TX-C is
 * never released on an unconfirmable on-chain check.
 */
async function onChainDelivered(
  seam: SponsoredCoinApi,
  target: { receiverAddress: string; energyNeeded: bigint },
): Promise<boolean> {
  try {
    return await seam.isEnergyDelivered(target);
  } catch {
    return false;
  }
}

/**
 * Reconcile an ambiguous rent-payment submit rejection into the action to dispatch.
 * submitEnergyRentPayment asks the provider to broadcast TX-A, so a rejection is ambiguous: the
 * payment may already be on-chain. TX-C is released only when delivery is confirmed on-chain, read
 * directly and independent of the provider's advisory status (LIVE-32780 AC2) — the provider's
 * order list pages only recent orders, so it can still report `paid`/`pending` after the delegation
 * has landed. Route to SUBMIT_FAILURE (-> RENT_PAYMENT copy, "funds not moved"; retry re-crafts a new
 * paid order) ONLY when the order is definitively unpaid; a paid/pending/unconfirmable payment goes to
 * DELIVERY_FAILURE ("funds moved, contact support") so a retry never silently pays twice. If the submit
 * was never attempted (seam unavailable), funds truly did not move. `paymentTxId` rides along so the
 * failure screen can show the hash for support/refund.
 * NOTE (follow-up): DELIVERY_FAILED's own retry still re-crafts; a non-re-crafting "payment uncertain"
 * state + resumable polling is the complete fix. See LIVE-32780 review.
 */
async function reconcileSubmitFailure(
  error: Error,
  ctx: Readonly<{
    submitAttempted: boolean;
    seam: SponsoredCoinApi | null;
    orderId: string;
    payerAddress?: string;
    paymentTxId?: string;
    target?: { receiverAddress: string; energyNeeded: bigint };
  }>,
): Promise<Action> {
  let fundsMayHaveMoved = false;
  let status: EnergyRentStatus | undefined;
  if (ctx.submitAttempted && ctx.seam && ctx.payerAddress) {
    try {
      status = await ctx.seam.getEnergyRentStatus({
        orderId: ctx.orderId,
        payerAddress: ctx.payerAddress,
      });
      fundsMayHaveMoved = status !== "failed";
    } catch {
      // Can't confirm the payment did NOT land — assume it may have, to avoid a double charge.
      fundsMayHaveMoved = true;
    }
  }
  // On-chain is authoritative and read regardless of provider status (mirrors reconcileDeliveryOutcome):
  // a delegation that landed while the provider still reports paid/pending must reach TX-C, not support.
  if (ctx.seam && ctx.target && (await onChainDelivered(ctx.seam, ctx.target))) {
    return { type: "DELIVERY_SUCCESS", paymentTxId: ctx.paymentTxId };
  }
  return fundsMayHaveMoved
    ? { type: "DELIVERY_FAILURE", error, paymentTxId: ctx.paymentTxId }
    : { type: "SUBMIT_FAILURE", error };
}

/**
 * Reconcile a delivery-poll rejection into the action to dispatch. A client-deadline timeout is not a
 * definitive failure — the rented energy may have landed just after our deadline — so do one final
 * authoritative on-chain read: a delivery confirmed on-chain is salvaged (DELIVERY_SUCCESS -> proceed
 * to TX-C) instead of prompting a second paid rental, while the provider's advisory status is never
 * trusted to release TX-C (LIVE-32780 AC2). Any non-timeout error is a plain DELIVERY_FAILURE.
 * NOTE (follow-up): a still-pending order lands on DELIVERY_FAILED, whose retry re-crafts; the complete
 * fix is a no-re-craft "payment uncertain" state + resumable polling.
 */
async function reconcileDeliveryOutcome(
  error: Error & { paymentTxId?: string },
  ctx: Readonly<{
    seam: SponsoredCoinApi;
    target: { receiverAddress: string; energyNeeded: bigint };
  }>,
): Promise<Action> {
  if (error?.name !== "EnergyDelegationTimeoutError") {
    return { type: "DELIVERY_FAILURE", error };
  }
  return (await onChainDelivered(ctx.seam, ctx.target))
    ? { type: "DELIVERY_SUCCESS" }
    : { type: "DELIVERY_TIMEOUT", error };
}

/**
 * Two-signature orchestration for a TRON Tronify sponsored send: craft an energy-rent order (TX A),
 * have the device sign + submit its payment (TX B), poll until the rented energy is delivered
 * on-chain, then hand control back to the caller to send the actual transfer (TX C).
 */
export function useSponsoredSendOrchestration(params: UseSponsoredSendOrchestrationParams): {
  state: SponsoredState;
  actions: SponsoredSendActions;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Generation token for invalidating in-flight async cycles. `reset()` (called by the context when
  // the send identity — recipient/amount/etc — changes) bumps it; every async action captures it at
  // entry and re-checks before each post-await dispatch. Without this, a craft/submit/poll that
  // started for a previous send can commit its order or delivery result into the freshly-reset state
  // and have the new flow sign/pay a payment transaction for the previous intent.
  const generationRef = useRef(0);

  // Aborts the in-flight delivery poll on reset/unmount. The generation token already discards a late
  // result; this additionally stops the seam's poll loop so it doesn't keep hitting the network until
  // the timeout for a flow the user has abandoned.
  const pollAbortRef = useRef<AbortController | null>(null);

  // Resolved lazily (on first action) rather than eagerly on mount, and cached — a non-TRON /
  // unconfigured caller (seam resolves null) should not pay for a lookup it never uses otherwise.
  // The cache is keyed by network|kind so a hook reused across a currency switch re-resolves.
  const seamCacheRef = useRef<{ key: string; promise: Promise<SponsoredCoinApi | null> } | null>(
    null,
  );
  const getSeam = useCallback((): Promise<SponsoredCoinApi | null> => {
    const key = `${params.network}|${params.kind}`;
    if (seamCacheRef.current?.key !== key) {
      // Drop the cache entry if resolution rejects, so a transient getCoinModuleApi failure stays
      // retryable — otherwise retry() would re-await the same rejected promise until a remount.
      const promise = getSponsoredCoinApi(params.network, params.kind).catch(error => {
        if (seamCacheRef.current?.key === key) seamCacheRef.current = null;
        throw error;
      });
      seamCacheRef.current = { key, promise };
    }
    return seamCacheRef.current.promise;
  }, [params.network, params.kind]);

  const craftRent = useCallback(async () => {
    const generation = generationRef.current;
    try {
      const seam = await getSeam();
      // Only the rent-signature screen calls craftRent, and only once the user has committed to the
      // sponsored flow — there is no availability probe on this path. Returning silently would
      // strand that screen on "Preparing energy rental…" with no cancel and no back, so surface it
      // through the same CRAFT_FAILURE the catch below uses.
      if (!seam) throw new Error("Sponsored send is unavailable for this account");
      // One seam call builds the request (energy simulated on-chain, addresses + config resolved in
      // the coin module); its payerAddress rides CRAFT_SUCCESS onto state so startRentPayment reuses
      // the exact payer that produced this order.
      const request = await seam.buildEnergyRentRequest(params.intent);
      if (generation !== generationRef.current) return;
      const order = await seam.craftEnergyRentTransaction(request);
      if (generation !== generationRef.current) return;
      // The seam types order.transaction as `unknown`; the signing screen asserts it to the family's
      // wire shape and reads its fields. Guard the one invariant every sponsored family shares here —
      // a crafted rent order must carry a transaction object to sign — so a null/partial payload fails
      // gracefully as RENT_PAYMENT instead of crashing that screen on a bad assertion. Family-specific
      // field checks stay in the family-aware view model, not this generic orchestration.
      if (!order || typeof order.transaction !== "object" || order.transaction === null) {
        dispatch({
          type: "CRAFT_FAILURE",
          error: new Error("Sponsored rent order is missing a signable transaction"),
        });
        return;
      }
      dispatch({
        type: "CRAFT_SUCCESS",
        order,
        payerAddress: request.payerAddress,
        // The receiver of the delegation and the transfer's full energy need drive the on-chain
        // delivery gate in startRentPayment; capture them from the same request that produced the order.
        receiverAddress: request.receiverAddress,
        energyNeeded: request.energy,
      });
    } catch (error) {
      if (generation !== generationRef.current) return;
      dispatch({ type: "CRAFT_FAILURE", error: error as Error });
    }
  }, [getSeam, params.intent]);

  const startRentPayment = useCallback(
    async (signedTransaction: unknown, paymentTxId?: string) => {
      const order = state.order;
      if (!order) return;
      const generation = generationRef.current;

      // Lock the native rent against the payer the moment TX-A may be on-chain, before any generation
      // guard (see onRentPaymentBroadcast). Guarded on payerAddress, the reservation's sender.
      const reserveRentPayment = () => {
        if (!state.payerAddress) return;
        params.onRentPaymentBroadcast?.({
          paymentTxId,
          payerAddress: state.payerAddress,
          payCoinAmt: order.payCoinAmt,
        });
      };

      // Seam resolution + submit share one failure surface: a getSeam rejection or a broadcast reject
      // both go through reconcileSubmitFailure rather than escaping as an unhandled rejection.
      let seam: SponsoredCoinApi | null = null;
      let submitAttempted = false;
      try {
        seam = await getSeam();
        // submitEnergyRentPayment is an irreversible charge, so unlike the post-await dispatch guards
        // this one must run before the side effect: if reset() bumped the generation while getSeam was
        // pending, the flow was abandoned and this stale signed payment must not be submitted at all.
        if (generation !== generationRef.current) return;
        // The device has already signed by the time we get here; a silent return would leave the
        // flow parked on RENT_SIGNING forever. If the seam is unavailable the submit never happens,
        // so funds have not moved and SUBMIT_FAILURE (-> RENT_PAYMENT copy) is the truthful outcome.
        if (!seam) throw new Error("Sponsored send is unavailable for this account");
        submitAttempted = true;
        await seam.submitEnergyRentPayment({ orderId: order.orderId, signedTransaction });
      } catch (error) {
        const action = await reconcileSubmitFailure(error as Error, {
          submitAttempted,
          seam,
          orderId: order.orderId,
          payerAddress: state.payerAddress ?? undefined,
          paymentTxId,
          // Present only when the order fully crafted (CRAFT_SUCCESS set both); absent skips the
          // on-chain confirm, so a "delivered" without a target can't release TX-C.
          target:
            state.receiverAddress && state.energyNeeded != null
              ? { receiverAddress: state.receiverAddress, energyNeeded: state.energyNeeded }
              : undefined,
        });
        // A submit reject reconciled to a funds-moved outcome (delivered, or delivery-side failure)
        // must still reserve the rent; SUBMIT_FAILURE means the payment never left, so it must not.
        if (action.type === "DELIVERY_SUCCESS" || action.type === "DELIVERY_FAILURE") {
          reserveRentPayment();
        }
        if (generation !== generationRef.current) return;
        dispatch(action);
        return;
      }

      reserveRentPayment();

      const payerAddress = state.payerAddress;
      const receiverAddress = state.receiverAddress;
      const energyNeeded = state.energyNeeded;
      if (!payerAddress || !receiverAddress || energyNeeded == null) {
        // Payer, receiver and energy target are set on state together with the order at CRAFT_SUCCESS,
        // so any of them missing here is a broken invariant — fail loudly rather than poll delivery
        // against order.orderId (an id, not an address) or an absent on-chain threshold. The payment
        // already succeeded, so this is a delivery-side failure.
        if (generation !== generationRef.current) return;
        dispatch({
          type: "DELIVERY_FAILURE",
          error: new Error("Missing rent order details; cannot poll energy delivery"),
        });
        return;
      }

      if (generation !== generationRef.current) return;
      const abortController = new AbortController();
      pollAbortRef.current = abortController;
      dispatch({ type: "POLLING_START", paymentTxId });
      try {
        await seam.awaitEnergyDelivery(
          { orderId: order.orderId, payerAddress },
          { receiverAddress, energyNeeded },
          {
            ...params.pollOpts,
            paymentTxId: paymentTxId ?? state.paymentTxId ?? undefined,
            signal: abortController.signal,
          },
        );
        if (generation !== generationRef.current) return;
        dispatch({ type: "DELIVERY_SUCCESS" });
      } catch (error) {
        const action = await reconcileDeliveryOutcome(error as Error & { paymentTxId?: string }, {
          seam,
          target: { receiverAddress, energyNeeded },
        });
        if (generation !== generationRef.current) return;
        dispatch(action);
      }
    },
    [
      getSeam,
      state.order,
      state.payerAddress,
      state.receiverAddress,
      state.energyNeeded,
      state.paymentTxId,
      params.pollOpts,
      params.onRentPaymentBroadcast,
    ],
  );

  const setContractDataFailure = useCallback((error: Error) => {
    // The resume phase is derived by the reducer from the live phase at dispatch time
    // (CONTRACT_DATA_FAILURE), so this needs no phase dependency of its own.
    dispatch({ type: "CONTRACT_DATA_FAILURE", error });
  }, []);

  const onTransferSuccess = useCallback(() => {
    dispatch({ type: "TRANSFER_SUCCESS" });
  }, []);

  const onTransferError = useCallback((error: Error) => {
    dispatch({ type: "TRANSFER_FAILURE", error });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  const reset = useCallback(() => {
    // Invalidate any in-flight craft/submit/poll so a result that resolves after this reset cannot
    // commit a stale order or delivery outcome into the new send's state, and stop the delivery poll.
    generationRef.current += 1;
    pollAbortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  // Closing the Send dialog unmounts this hook without a reset(), so invalidate the generation on
  // unmount too: a signed TX-A whose getSeam()/submit is still in flight is then dropped by the
  // pre-submit guard rather than charging the payer for a cancelled flow, and stop the delivery poll.
  useEffect(
    () => () => {
      generationRef.current += 1;
      pollAbortRef.current?.abort();
    },
    [],
  );

  const actions = useMemo(
    () => ({
      craftRent,
      startRentPayment,
      onTransferSuccess,
      setContractDataFailure,
      onTransferError,
      retry,
      reset,
    }),
    [
      craftRent,
      startRentPayment,
      onTransferSuccess,
      setContractDataFailure,
      onTransferError,
      retry,
      reset,
    ],
  );

  return { state, actions };
}
