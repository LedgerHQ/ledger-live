import { useCallback, useMemo, useReducer, useRef } from "react";
import { getSponsoredCoinApi } from "../../../bridge/generic-coin-framework/sponsored";
import type {
  EnergyRentOrder,
  EnergyRentRequest,
  SponsoredCoinApi,
} from "../../../bridge/generic-coin-framework/sponsored";
import { SPONSORED_FAILURE_KIND, SPONSORED_PHASE } from "./types";
import type { SponsoredState } from "./types";

export type UseSponsoredSendOrchestrationParams = Readonly<{
  network: string; // parent-chain currency id (e.g. "tron") — NOT a token id
  kind: string; // bridge kind — "local" for a generic-coin-framework family
  // The send intent. craftRent derives the rent order from it via the seam's buildEnergyRentRequest
  // (which simulates the required energy on-chain), so the app doesn't estimate energy or read config.
  intent: unknown;
  pollOpts?: { intervalMs?: number; timeoutMs?: number };
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
  paymentTxId: null,
  failureKind: null,
  failureError: null,
};

type Action =
  | { type: "CRAFT_SUCCESS"; order: EnergyRentOrder }
  | { type: "CRAFT_FAILURE"; error: Error }
  | { type: "SUBMIT_FAILURE"; error: Error }
  | { type: "POLLING_START"; paymentTxId?: string }
  | { type: "DELIVERY_SUCCESS" }
  | { type: "DELIVERY_TIMEOUT"; error: Error & { paymentTxId?: string } }
  | { type: "DELIVERY_FAILURE"; error: Error }
  | { type: "TRANSFER_SUCCESS" }
  | { type: "CONTRACT_DATA_FAILURE"; error: Error }
  | { type: "TRANSFER_FAILURE"; error: Error }
  | {
      type: "RETRY";
      contractDataPhase: typeof SPONSORED_PHASE.RENT_SIGNING | typeof SPONSORED_PHASE.TRANSFER;
    }
  | { type: "RESET" };

function reducer(state: SponsoredState, action: Action): SponsoredState {
  switch (action.type) {
    case "CRAFT_SUCCESS":
      return {
        ...state,
        phase: SPONSORED_PHASE.RENT_SIGNING,
        order: action.order,
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
      return { ...state, phase: SPONSORED_PHASE.TRANSFER };
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
      // TX A already succeeded — the energy just never arrived (an explicit provider failure rather
      // than a poll timeout), the same user situation as a timeout: funds moved, contact support,
      // retry re-crafts. So it shares the DELIVERY_FAILED kind — never RENT_PAYMENT, whose "funds
      // were not moved" copy would be wrong here. paymentTxId (set at POLLING_START) survives the spread.
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
        failureError: action.error,
      };
    case "CONTRACT_DATA_FAILURE":
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.CONTRACT_DATA,
        failureError: action.error,
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
            // The prior payment id belongs to the stale order — clear it with the order.
            paymentTxId: null,
            failureKind: null,
            failureError: null,
          };
        case SPONSORED_FAILURE_KIND.CONTRACT_DATA:
          // The order/delegation is untouched by a device refusal — resume at the step it failed
          // on (recorded by the caller at the moment of failure; see `setContractDataFailure`).
          // Shallow-clone the order so useEffect([order]) in the VM fires and hasSubmittedRef resets.
          return {
            ...state,
            phase: action.contractDataPhase,
            order: state.order ? { ...state.order } : null,
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
 * Two-signature orchestration for a TRON Tronify sponsored send: craft an energy-rent order (TX A),
 * have the device sign + submit its payment (TX B), poll until the rented energy is delivered
 * on-chain, then hand control back to the caller to send the actual transfer (TX C).
 */
export function useSponsoredSendOrchestration(params: UseSponsoredSendOrchestrationParams): {
  state: SponsoredState;
  actions: SponsoredSendActions;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

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

  // The request built in craftRent() is the only place payerAddress is known; captured here so
  // startRentPayment doesn't risk building a divergent one via a second buildRentRequest() call.
  const requestRef = useRef<EnergyRentRequest | null>(null);

  // Where a CONTRACT_DATA failure occurred (rent-signing vs. the post-delivery transfer), so
  // retry() can resume at the right step. Not part of SponsoredState: it is caller-observed at the
  // moment of failure, not a phase the state machine itself transitions through.
  const contractDataPhaseRef = useRef<
    typeof SPONSORED_PHASE.RENT_SIGNING | typeof SPONSORED_PHASE.TRANSFER
  >(SPONSORED_PHASE.RENT_SIGNING);

  // Incremented by reset() to invalidate any in-flight craftRent() promise so a stale CRAFT_SUCCESS
  // cannot resurrect RENT_SIGNING phase after the user has explicitly cancelled.
  const craftGenRef = useRef(0);

  const craftRent = useCallback(async () => {
    const gen = ++craftGenRef.current;
    try {
      const seam = await getSeam();
      if (!seam || craftGenRef.current !== gen) return;
      // One seam call builds the request (energy simulated on-chain, addresses + config resolved in
      // the coin module); captured in requestRef so startRentPayment reuses its payerAddress.
      const request = await seam.buildEnergyRentRequest(params.intent);
      if (craftGenRef.current !== gen) return;
      requestRef.current = request;
      const order = await seam.craftEnergyRentTransaction(request);
      if (craftGenRef.current !== gen) return;
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
      dispatch({ type: "CRAFT_SUCCESS", order });
    } catch (error) {
      if (craftGenRef.current !== gen) return;
      dispatch({ type: "CRAFT_FAILURE", error: error as Error });
    }
  }, [getSeam, params.intent]);

  const startRentPayment = useCallback(
    async (signedTransaction: unknown, paymentTxId?: string) => {
      const order = state.order;
      if (!order) return;

      // Seam resolution + submit share one failure surface (RENT_PAYMENT): a getSeam rejection or a
      // broadcast reject both land the flow in FAILED rather than escaping as an unhandled rejection.
      let seam: SponsoredCoinApi | null = null;
      try {
        seam = await getSeam();
        if (!seam) return;
        await seam.submitEnergyRentPayment({ orderId: order.orderId, signedTransaction });
      } catch (error) {
        dispatch({ type: "SUBMIT_FAILURE", error: error as Error });
        return;
      }

      const payerAddress = requestRef.current?.payerAddress;
      if (!payerAddress) {
        // requestRef is set alongside the order in craftRent, so a missing payer here is a broken
        // invariant — fail loudly rather than poll delivery against order.orderId (an id, not an
        // address). The payment already succeeded, so this is a delivery-side failure.
        dispatch({
          type: "DELIVERY_FAILURE",
          error: new Error("Missing rent payer address; cannot poll energy delivery"),
        });
        return;
      }

      dispatch({ type: "POLLING_START", paymentTxId });
      try {
        await seam.awaitEnergyDelivery(
          { orderId: order.orderId, payerAddress },
          { ...params.pollOpts, paymentTxId: paymentTxId ?? state.paymentTxId ?? undefined },
        );
        dispatch({ type: "DELIVERY_SUCCESS" });
      } catch (error) {
        const err = error as Error & { paymentTxId?: string };
        if (err?.name === "EnergyDelegationTimeoutError") {
          dispatch({ type: "DELIVERY_TIMEOUT", error: err });
        } else {
          dispatch({ type: "DELIVERY_FAILURE", error: err });
        }
      }
    },
    [getSeam, state.order, state.paymentTxId, params.pollOpts],
  );

  const setContractDataFailure = useCallback(
    (error: Error) => {
      contractDataPhaseRef.current =
        state.phase === SPONSORED_PHASE.TRANSFER
          ? SPONSORED_PHASE.TRANSFER
          : SPONSORED_PHASE.RENT_SIGNING;
      dispatch({ type: "CONTRACT_DATA_FAILURE", error });
    },
    [state.phase],
  );

  const onTransferSuccess = useCallback(() => {
    dispatch({ type: "TRANSFER_SUCCESS" });
  }, []);

  const onTransferError = useCallback((error: Error) => {
    dispatch({ type: "TRANSFER_FAILURE", error });
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: "RETRY", contractDataPhase: contractDataPhaseRef.current });
  }, []);

  const reset = useCallback(() => {
    craftGenRef.current++;
    dispatch({ type: "RESET" });
  }, []);

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
