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
  RentPayment,
  SponsoredCoinApi,
} from "../../../bridge/generic-coin-framework/sponsored";
import { SponsoredFeeNotApprovedError, SponsoredSendUnavailableError } from "./errors";
import { SPONSORED_FAILURE_KIND, SPONSORED_PHASE } from "./types";
import type { SponsoredState } from "./types";

export type UseSponsoredSendOrchestrationParams = Readonly<{
  network: string; // parent-chain currency id — NOT a token id
  kind: string;
  intent: unknown;
  pollOpts?: { intervalMs?: number; timeoutMs?: number };
  // Fires even after reset/unmount: TX-A may already be on-chain.
  onRentPaymentBroadcast?: (info: {
    paymentTxId?: string;
    payerAddress: string;
    rentPayment: RentPayment;
  }) => void;
}>;

export type SponsoredSendActions = Readonly<{
  /** `approvedFee` is the sponsored fee approved on Review. A cycle's first craft binds it and its
   * retries reuse it; null with nothing bound fails the craft. */
  craftRent: (approvedFee: bigint | null) => Promise<void>;
  // Callbacks pass the paymentTxId captured when their device step started; a stale cycle's is dropped.
  startRentPayment: (combinedSignature: string, signedPaymentTxId: string | null) => Promise<void>;
  onTransferSuccess: (signedPaymentTxId: string | null) => void;
  setContractDataFailure: (error: Error, signedPaymentTxId: string | null) => void;
  onTransferError: (error: Error, signedPaymentTxId: string | null) => void;
  retry: () => void;
  reset: () => void;
}>;

const initialState: SponsoredState = {
  phase: SPONSORED_PHASE.IDLE,
  order: null,
  toSign: null,
  rentPayment: null,
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
      rentPayment: RentPayment;
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
        rentPayment: action.rentPayment,
        payerAddress: action.payerAddress,
        receiverAddress: action.receiverAddress,
        energyNeeded: action.energyNeeded,
        paymentTxId: action.paymentTxId,
        failureKind: null,
        failureError: null,
      };
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
      return {
        ...state,
        phase: SPONSORED_PHASE.TRANSFER,
        paymentTxId: action.paymentTxId ?? state.paymentTxId,
      };
    case "TRANSFER_SUCCESS":
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
      // Funds may have moved: never RENT_PAYMENT, or a retry would pay twice.
      return {
        ...state,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED,
        failureError: action.error,
        paymentTxId: action.paymentTxId ?? state.paymentTxId,
      };
    case "CONTRACT_DATA_FAILURE":
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
        contractDataResumePhase:
          state.phase === SPONSORED_PHASE.TRANSFER
            ? SPONSORED_PHASE.TRANSFER
            : SPONSORED_PHASE.RENT_SIGNING,
      };
    case "TRANSFER_FAILURE":
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
          return {
            ...state,
            phase: SPONSORED_PHASE.RENT_SIGNING,
            order: null,
            toSign: null,
            rentPayment: null,
            payerAddress: null,
            receiverAddress: null,
            energyNeeded: null,
            paymentTxId: null,
            failureKind: null,
            failureError: null,
          };
        case SPONSORED_FAILURE_KIND.CONTRACT_DATA:
          return {
            ...state,
            phase: state.contractDataResumePhase,
            failureKind: null,
            failureError: null,
          };
        case SPONSORED_FAILURE_KIND.TRANSFER:
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

/** On-chain is authoritative; provider status is advisory (ADR-058 C4). */
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
 * ADR-058 C4: delivered on-chain → TX-C; definitively unpaid → SUBMIT_FAILURE; otherwise
 * DELIVERY_FAILURE, so a retry never pays twice. NOTE(LIVE-32780): DELIVERY_FAILED still re-crafts.
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
      // Unconfirmed: assume it may have landed, to avoid a double charge.
      return true;
    }
  };
  // Only after a submit: prior on-chain energy isn't this order's delivery.
  const readDelivered = async (): Promise<boolean> =>
    target ? onChainDelivered(seam, target) : false;
  // Both reads catch internally, so Promise.all never short-circuits.
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

/** A timeout isn't definitive: one last on-chain read can salvage it (ADR-058 C4). */
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

type RentFlowContext = Readonly<{
  generation: number;
  generationRef: MutableRefObject<number>;
  dispatch: Dispatch<Action>;
}>;

/** The seam on a clean submit; null once a terminal action was dispatched or the flow was superseded. */
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
    // Checked before the irreversible submit, not after.
    if (ctx.generation !== ctx.generationRef.current) return null;
    if (!seam) throw new SponsoredSendUnavailableError();
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
    if (error?.name === "EnergyDeliveryAbortedError") return;
    const action = await reconcileDeliveryOutcome(error, {
      seam,
      target: { receiverAddress: args.receiverAddress, energyNeeded: args.energyNeeded },
    });
    if (ctx.generation !== ctx.generationRef.current) return;
    ctx.dispatch(action);
  } finally {
    if (ctx.pollAbortRef.current === abortController) ctx.pollAbortRef.current = null;
  }
}

/**
 * TRON Tronify sponsored send: pay TX-A (rent), await on-chain delivery, then the caller sends TX-C.
 * The phases model this mechanism only (see SponsoredCoinApi).
 */
export function useSponsoredSendOrchestration(params: UseSponsoredSendOrchestrationParams): {
  state: SponsoredState;
  actions: SponsoredSendActions;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Read by startRentPayment so a retained closure sees live state and can't re-broadcast TX-A.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Bumped by reset()/unmount; async results from an older generation are dropped.
  const generationRef = useRef(0);

  const pollAbortRef = useRef<AbortController | null>(null);

  // TX-A is irreversible: never submit it twice concurrently.
  const inFlightRef = useRef(false);

  // Only the latest craftRent may commit: overlapping calls share a generation.
  const craftSeqRef = useRef(0);

  // The live quote reloads and can be withdrawn mid-cycle; a retry keeps the fee the user approved.
  const boundFeeRef = useRef<{ generation: number; fee: bigint } | null>(null);

  const seamCacheRef = useRef<{ key: string; promise: Promise<SponsoredCoinApi | null> } | null>(
    null,
  );
  const getSeam = useCallback((): Promise<SponsoredCoinApi | null> => {
    const key = `${params.network}|${params.kind}`;
    if (seamCacheRef.current?.key !== key) {
      // Drop a rejected entry so retry() can re-resolve.
      const promise = getSponsoredCoinApi(params.network, params.kind).catch(error => {
        if (seamCacheRef.current?.key === key) seamCacheRef.current = null;
        throw error;
      });
      seamCacheRef.current = { key, promise };
    }
    return seamCacheRef.current.promise;
  }, [params.network, params.kind]);

  const craftRent = useCallback(
    async (approvedFee: bigint | null) => {
      const generation = generationRef.current;
      const craftSeq = ++craftSeqRef.current;
      const isStale = () =>
        generation !== generationRef.current || craftSeq !== craftSeqRef.current;
      try {
        const bound = boundFeeRef.current;
        const fee = bound?.generation === generation ? bound.fee : approvedFee;
        if (fee === null) throw new SponsoredFeeNotApprovedError();
        boundFeeRef.current = { generation, fee };
        const seam = await getSeam();
        if (!seam) throw new SponsoredSendUnavailableError();
        const request = await seam.buildEnergyRentRequest(params.intent, fee);
        if (isStale()) return;
        const order = await seam.craftEnergyRentTransaction(request);
        if (isStale()) return;
        if (!order || typeof order.transaction !== "object" || order.transaction === null) {
          dispatch({
            type: "CRAFT_FAILURE",
            error: new Error("Sponsored rent order is missing a signable transaction"),
          });
          return;
        }
        const { toSign, paymentTxId } = seam.getEnergyRentSignaturePayload(order.transaction);
        dispatch({
          type: "CRAFT_SUCCESS",
          order,
          toSign,
          paymentTxId,
          rentPayment: seam.rentPayment(order),
          payerAddress: request.payerAddress,
          receiverAddress: request.receiverAddress,
          energyNeeded: request.energy,
        });
      } catch (error) {
        if (isStale()) return;
        dispatch({ type: "CRAFT_FAILURE", error: error as Error });
      }
    },
    [getSeam, params.intent],
  );

  const startRentPayment = useCallback(
    async (combinedSignature: string, signedPaymentTxId: string | null) => {
      const s = stateRef.current;
      const order = s.order;
      if (!order) return;
      // Only RENT_SIGNING may broadcast TX-A; the order outlives it.
      if (s.phase !== SPONSORED_PHASE.RENT_SIGNING) return;
      if (!isCurrentCycle(s, signedPaymentTxId)) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const generation = generationRef.current;
        const paymentTxId = s.paymentTxId ?? undefined;

        const reserveRentPayment = () => {
          if (!s.payerAddress || !s.rentPayment) return;
          params.onRentPaymentBroadcast?.({
            paymentTxId,
            payerAddress: s.payerAddress,
            rentPayment: s.rentPayment,
          });
        };

        const ctx = { generation, generationRef, dispatch };
        const seam = await submitRentPayment(
          combinedSignature,
          {
            order,
            payerAddress: s.payerAddress,
            paymentTxId,
            // No target → no on-chain confirm → TX-C is never released.
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
    // Reads go through stateRef; oxlint miscounts the member dep.
    // oxlint-disable-next-line react/memo-dependencies
    [getSeam, params.pollOpts, params.onRentPaymentBroadcast],
  );

  const setContractDataFailure = useCallback((error: Error, signedPaymentTxId: string | null) => {
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
    generationRef.current += 1;
    pollAbortRef.current?.abort();
    dispatch({ type: "RESET" });
  }, []);

  // Unmount skips reset(): invalidate so an in-flight submit is dropped.
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
