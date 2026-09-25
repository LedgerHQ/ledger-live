import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type MutableRefObject,
} from "react";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  EnergyRentOrder,
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
    reservedNativeAmount: bigint;
  }) => void;
}>;

export type SponsoredSendActions = Readonly<{
  craftRent: () => Promise<void>; // craft order, phase -> RENT_SIGNING
  // Every externally-fired callback below takes signedPaymentTxId: state.paymentTxId captured when the
  // device step STARTED (not re-read when it resolves — the live value always matches). A callback from
  // a superseded cycle is then dropped; the phase repeats across cycles, so it can't identify one alone.
  //
  // submit TX A (rebuilt from the device's combined signature via the family seam) + await delivery.
  // TX A's hash is captured on state at craft, so a delivery timeout can surface it for support/refund.
  startRentPayment: (combinedSignature: string, signedPaymentTxId: string | null) => Promise<void>;
  onTransferSuccess: (signedPaymentTxId: string | null) => void; // UI calls when TX C is broadcast — terminal DONE
  setContractDataFailure: (error: Error, signedPaymentTxId: string | null) => void; // UI calls on a device contract-data refusal
  onTransferError: (error: Error, signedPaymentTxId: string | null) => void; // UI calls when TX C fails after delivery
  retry: () => void; // reset to the correct step by failureKind
  reset: () => void; // back to IDLE
}>;

const initialState: SponsoredState = {
  phase: SPONSORED_PHASE.IDLE,
  order: null,
  toSign: null,
  reservedNativeAmount: null,
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
      toSign: string;
      paymentTxId: string;
      reservedNativeAmount: bigint;
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
  | { type: "TRANSFER_SUCCESS"; signedPaymentTxId: string | null }
  | { type: "CONTRACT_DATA_FAILURE"; error: Error; signedPaymentTxId: string | null }
  | { type: "TRANSFER_FAILURE"; error: Error; signedPaymentTxId: string | null }
  | { type: "RETRY" }
  | { type: "RESET" };

function isCurrentCycle(state: SponsoredState, signedPaymentTxId: string | null): boolean {
  return signedPaymentTxId !== null && signedPaymentTxId === state.paymentTxId;
}

function reducer(state: SponsoredState, action: Action): SponsoredState {
  switch (action.type) {
    case "CRAFT_SUCCESS":
      return {
        ...state,
        phase: SPONSORED_PHASE.RENT_SIGNING,
        order: action.order,
        toSign: action.toSign,
        reservedNativeAmount: action.reservedNativeAmount,
        payerAddress: action.payerAddress,
        receiverAddress: action.receiverAddress,
        energyNeeded: action.energyNeeded,
        // TX-A's id is known from the crafted (unsigned) order — signing doesn't change it — so capture
        // it now; it drives the reservation and the delivery poll, and replaces any id from a prior
        // (retried) craft cycle.
        paymentTxId: action.paymentTxId,
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
      // TX-C outcomes are only valid while the transfer is live. onTransferSuccess/onTransferError are
      // fired externally by the UI device action, so a delayed callback from a flow that was reset and
      // reused must not drive the new flow (still at IDLE/RENT_SIGNING, or already terminal) to DONE.
      if (state.phase !== SPONSORED_PHASE.TRANSFER) return state;
      if (!isCurrentCycle(state, action.signedPaymentTxId)) return state;
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
      // Only valid mid-signing. setContractDataFailure is fired externally by the UI device action, so a
      // refusal from a flow that was reset and reused (now IDLE/POLLING/DONE) must not drive the new flow
      // to FAILED. A contract-data refusal only ever arrives while signing the rent tx (RENT_SIGNING) or
      // the transfer (TRANSFER).
      if (
        state.phase !== SPONSORED_PHASE.RENT_SIGNING &&
        state.phase !== SPONSORED_PHASE.TRANSFER
      ) {
        return state;
      }
      if (!isCurrentCycle(state, action.signedPaymentTxId)) return state;
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.CONTRACT_DATA,
        failureError: action.error,
        // Resume from the live pre-failure signing phase (guaranteed RENT_SIGNING or TRANSFER by the guard).
        contractDataResumePhase:
          state.phase === SPONSORED_PHASE.TRANSFER
            ? SPONSORED_PHASE.TRANSFER
            : SPONSORED_PHASE.RENT_SIGNING,
      };
    case "TRANSFER_FAILURE":
      // Same guard as TRANSFER_SUCCESS: a stale externally-fired transfer callback must not fail a flow
      // that is no longer in the transfer step.
      if (state.phase !== SPONSORED_PHASE.TRANSFER) return state;
      if (!isCurrentCycle(state, action.signedPaymentTxId)) return state;
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
            // The prior signable hex, native amount, payer, receiver, energy target and payment id
            // belong to the stale order — clear them with it so the re-craft repopulates them.
            toSign: null,
            reservedNativeAmount: null,
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
 * Reconcile an ambiguous TX-A submit rejection: confirmed on-chain → TX-C (ADR-058 C4); definitively
 * unpaid or never submitted → SUBMIT_FAILURE; otherwise DELIVERY_FAILURE, so a retry never pays twice.
 * NOTE (follow-up): DELIVERY_FAILED still re-crafts on retry; needs a "payment uncertain" state (LIVE-32780).
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
  const { submitAttempted, seam, orderId, payerAddress, paymentTxId, target } = ctx;
  if (!submitAttempted || !seam) return { type: "SUBMIT_FAILURE", error };
  const readFundsMayHaveMoved = async (): Promise<boolean> => {
    if (!payerAddress) return true;
    try {
      const status = await seam.getEnergyRentStatus({ orderId, payerAddress });
      return status !== "failed";
    } catch {
      // Can't confirm the payment did NOT land — assume it may have, to avoid a double charge.
      return true;
    }
  };
  // On-chain is authoritative and read regardless of provider status (mirrors reconcileDeliveryOutcome):
  // a delegation that landed while the provider still reports paid/pending must reach TX-C, not support.
  // Gated on submitAttempted: with no submit, any on-chain energy is pre-existing (not from this order),
  // so it must not be read as "delivered" — that would reserve rent for a payment that never happened.
  const readDelivered = async (): Promise<boolean> =>
    target ? onChainDelivered(seam, target) : false;
  // Safe to run concurrently only because both reads fail closed internally (never reject).
  const [fundsMayHaveMoved, delivered] = await Promise.all([
    readFundsMayHaveMoved(),
    readDelivered(),
  ]);
  if (delivered) {
    return { type: "DELIVERY_SUCCESS", paymentTxId };
  }
  return fundsMayHaveMoved
    ? { type: "DELIVERY_FAILURE", error, paymentTxId }
    : { type: "SUBMIT_FAILURE", error };
}

/**
 * A poll timeout isn't definitive: one final on-chain read salvages a late delivery (ADR-058 C4) rather
 * than prompting a second rental. Any other error is DELIVERY_FAILURE. Same follow-up as above.
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

// Shared invalidation context for the async rent-payment helpers: the generation captured at entry,
// the live generation ref to re-check against, and the reducer dispatch.
type RentFlowContext = Readonly<{
  generation: number;
  generationRef: MutableRefObject<number>;
  dispatch: Dispatch<Action>;
}>;

/**
 * Submit the signed TX-A and reconcile the outcome. Returns the resolved seam to poll delivery with on
 * a clean submit; returns null when a terminal action was already dispatched (submit rejected and
 * reconciled) or the flow was superseded by a reset/unmount. `reserveRentPayment` fires the native-rent
 * lock on any funds-moved outcome (clean submit, or a rejection reconciled to delivered/delivery-side
 * failure) and is deliberately independent of the generation guard — the payer is charged regardless.
 */
async function submitRentPayment(
  combinedSignature: string,
  args: Readonly<{
    order: EnergyRentOrder;
    payerAddress: string | null;
    paymentTxId?: string;
    target?: { receiverAddress: string; energyNeeded: bigint };
    getSeam: () => Promise<SponsoredCoinApi | null>;
    reserveRentPayment: () => void;
  }>,
  ctx: RentFlowContext,
): Promise<SponsoredCoinApi | null> {
  let seam: SponsoredCoinApi | null = null;
  let submitAttempted = false;
  try {
    seam = await args.getSeam();
    // submitEnergyRentPayment is an irreversible charge, so unlike the post-await dispatch guards this
    // one must run before the side effect: if reset() bumped the generation while getSeam was pending,
    // the flow was abandoned and this stale signed payment must not be submitted at all.
    if (ctx.generation !== ctx.generationRef.current) return null;
    // The device has already signed by the time we get here; a silent return would strand the flow on
    // RENT_SIGNING. If the seam is unavailable the submit never happens, so funds have not moved and
    // SUBMIT_FAILURE (-> RENT_PAYMENT copy) is the truthful outcome.
    if (!seam) throw new Error("Sponsored send is unavailable for this account");
    // The family seam rebuilds its wire-shaped signed payload from the device's combined signature, so
    // this generic flow submits an opaque tx it never constructed.
    const signedTransaction = seam.buildSignedEnergyRentTransaction(
      args.order.transaction,
      combinedSignature,
    );
    submitAttempted = true;
    await seam.submitEnergyRentPayment({ orderId: args.order.orderId, signedTransaction });
  } catch (error) {
    const action = await reconcileSubmitFailure(error as Error, {
      submitAttempted,
      seam,
      orderId: args.order.orderId,
      payerAddress: args.payerAddress ?? undefined,
      paymentTxId: args.paymentTxId,
      target: args.target,
    });
    // A submit reject reconciled to a funds-moved outcome (delivered, or delivery-side failure) must
    // still reserve the rent; SUBMIT_FAILURE means the payment never left, so it must not.
    if (action.type === "DELIVERY_SUCCESS" || action.type === "DELIVERY_FAILURE") {
      args.reserveRentPayment();
    }
    if (ctx.generation !== ctx.generationRef.current) return null;
    ctx.dispatch(action);
    return null;
  }
  args.reserveRentPayment();
  return seam;
}

/**
 * Poll for on-chain energy delivery after a clean TX-A submit, then dispatch the outcome. A poll
 * rejection is reconciled (a post-deadline delivery is salvaged to DELIVERY_SUCCESS; see
 * reconcileDeliveryOutcome). The AbortController lets reset/unmount stop the seam's poll loop.
 */
async function runDeliveryPoll(
  seam: SponsoredCoinApi,
  args: Readonly<{
    order: EnergyRentOrder;
    payerAddress: string;
    receiverAddress: string;
    energyNeeded: bigint;
    paymentTxId?: string;
    pollOpts?: { intervalMs?: number; timeoutMs?: number };
  }>,
  ctx: RentFlowContext & { pollAbortRef: MutableRefObject<AbortController | null> },
): Promise<void> {
  const abortController = new AbortController();
  ctx.pollAbortRef.current = abortController;
  ctx.dispatch({ type: "POLLING_START", paymentTxId: args.paymentTxId });
  try {
    await seam.awaitEnergyDelivery(
      { orderId: args.order.orderId, payerAddress: args.payerAddress },
      { receiverAddress: args.receiverAddress, energyNeeded: args.energyNeeded },
      { ...args.pollOpts, paymentTxId: args.paymentTxId, signal: abortController.signal },
    );
    if (ctx.generation !== ctx.generationRef.current) return;
    ctx.dispatch({ type: "DELIVERY_SUCCESS" });
  } catch (err) {
    const error = err as Error & { paymentTxId?: string };
    // Abort (reset/unmount) is an abandoned poll, not a delivery outcome — return without reconciling
    // (mirrors awaitEnergyDeliveryWith: abort is distinct from timeout). The finally still clears the ref.
    if (error?.name === "EnergyDeliveryAbortedError") return;
    const action = await reconcileDeliveryOutcome(error, {
      seam,
      target: { receiverAddress: args.receiverAddress, energyNeeded: args.energyNeeded },
    });
    if (ctx.generation !== ctx.generationRef.current) return;
    ctx.dispatch(action);
  } finally {
    // The controller has done its job once the poll settles; drop the ref (only while it is still ours)
    // so a later reset/unmount doesn't abort a dead controller.
    if (ctx.pollAbortRef.current === abortController) ctx.pollAbortRef.current = null;
  }
}

/**
 * Two-signature orchestration for a TRON Tronify sponsored send: craft an energy-rent order (TX A),
 * have the device sign + submit its payment (TX A), poll until the rented energy is delivered
 * on-chain, then hand control back to the caller to send the actual transfer (TX C). The phases are
 * that mechanism's, not a validated cross-family model (see SponsoredCoinApi).
 */
export function useSponsoredSendOrchestration(params: UseSponsoredSendOrchestrationParams): {
  state: SponsoredState;
  actions: SponsoredSendActions;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Live mirror of the reducer state. startRentPayment can be invoked from a closure a device/signature
  // UI captured on an earlier render, so its guards and the order/payer it submits must read the CURRENT
  // state through this ref — never the render snapshot the closure closed over. Otherwise a stale
  // RENT_SIGNING closure firing after the flow advanced would re-broadcast TX-A and double-charge the
  // rental. Updated in an effect (not during render): the callback only ever fires from an async device
  // event, long after the effect for the committed state has run, so the ref is current at invocation.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

  // Serializes startRentPayment: TX-A is an irreversible broadcast, so two concurrent invocations must
  // not submit the same signed payment twice. Set synchronously before any await; a stale-generation
  // call still clears it in the finally.
  const inFlightRef = useRef(false);

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
      // The family seam owns the wire tx: it yields the hex + payment id to sign and the native amount
      // to reserve, so the signing screen and the reservation never touch the opaque payload.
      const { toSign, paymentTxId } = seam.getEnergyRentSignaturePayload(order.transaction);
      dispatch({
        type: "CRAFT_SUCCESS",
        order,
        toSign,
        paymentTxId,
        reservedNativeAmount: seam.nativeRentAmount(order),
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
    async (combinedSignature: string, signedPaymentTxId: string | null) => {
      // One snapshot of the live state (stateRef) at entry, so order/payer/txid stay mutually consistent
      // for this submit.
      const s = stateRef.current;
      const order = s.order;
      if (!order) return;
      // Only the rent-signing step may broadcast TX-A. The order is retained into TRANSFER/DONE, so a
      // stale or duplicate signature callback firing after the flow advanced must not re-submit and
      // double-charge the rental. A retry re-enters RENT_SIGNING, so it stays allowed.
      if (s.phase !== SPONSORED_PHASE.RENT_SIGNING) return;
      // Bind the signature to the order it was produced for: reset() + re-craft yields a new order under a
      // new RENT_SIGNING cycle, so a delayed signature from the previous cycle would otherwise be combined
      // with the current order's bytes (the phase alone can't tell two cycles apart).
      if (!isCurrentCycle(s, signedPaymentTxId)) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const generation = generationRef.current;
        // TX-A's id and the native amount to reserve were captured from the crafted order at CRAFT_SUCCESS.
        const paymentTxId = s.paymentTxId ?? undefined;

        // Lock the native rent against the payer the moment TX-A may be on-chain, before any generation
        // guard (see onRentPaymentBroadcast). Guarded on payerAddress (the reservation's sender) and the
        // seam-derived native amount.
        const reserveRentPayment = () => {
          if (!s.payerAddress || s.reservedNativeAmount == null) return;
          params.onRentPaymentBroadcast?.({
            paymentTxId,
            payerAddress: s.payerAddress,
            reservedNativeAmount: s.reservedNativeAmount,
          });
        };

        const ctx = { generation, generationRef, dispatch };
        // A null return means submitRentPayment already dispatched a terminal action or the flow was
        // superseded — nothing left to do here.
        const seam = await submitRentPayment(
          combinedSignature,
          {
            order,
            payerAddress: s.payerAddress,
            paymentTxId,
            // Present only when the order fully crafted (CRAFT_SUCCESS set both); absent skips the
            // on-chain confirm, so a "delivered" without a target can't release TX-C.
            target:
              s.receiverAddress && s.energyNeeded != null
                ? { receiverAddress: s.receiverAddress, energyNeeded: s.energyNeeded }
                : undefined,
            getSeam,
            reserveRentPayment,
          },
          ctx,
        );
        if (!seam) return;

        const payerAddress = s.payerAddress;
        const receiverAddress = s.receiverAddress;
        const energyNeeded = s.energyNeeded;
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
        await runDeliveryPoll(
          seam,
          {
            order,
            payerAddress,
            receiverAddress,
            energyNeeded,
            paymentTxId,
            pollOpts: params.pollOpts,
          },
          { ...ctx, pollAbortRef },
        );
      } finally {
        inFlightRef.current = false;
      }
    },
    // No state.* deps: every read goes through stateRef.current so a retained closure observes the live
    // phase/order — listing state would neither help that nor be needed. oxlint's memo-dependencies
    // miscounts a member dep as extra; the authoritative exhaustive-deps agrees.
    // oxlint-disable-next-line react/memo-dependencies
    [getSeam, params.pollOpts, params.onRentPaymentBroadcast],
  );

  const setContractDataFailure = useCallback((error: Error, signedPaymentTxId: string | null) => {
    // The resume phase and the identity check are both derived by the reducer from live state at dispatch
    // time (CONTRACT_DATA_FAILURE), so this needs no phase dependency of its own.
    dispatch({ type: "CONTRACT_DATA_FAILURE", error, signedPaymentTxId });
  }, []);

  const onTransferSuccess = useCallback((signedPaymentTxId: string | null) => {
    dispatch({ type: "TRANSFER_SUCCESS", signedPaymentTxId });
  }, []);

  const onTransferError = useCallback((error: Error, signedPaymentTxId: string | null) => {
    dispatch({ type: "TRANSFER_FAILURE", error, signedPaymentTxId });
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
