import BigNumber from "bignumber.js";
import coinConfig from "../../config";
import {
  EnergyDelegationTimeoutError,
  EnergyRentProviderNotConfigured,
  TronifyApiError,
} from "../../types/errors";
import {
  ENERGY_RENT_POLL_INTERVAL_MS,
  ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS,
  ENERGY_RENT_POLL_TIMEOUT_MS,
} from "../constants";
import { tronifyProvider } from "./tronify";
import type {
  EnergyProvider,
  EnergyRentOrder,
  EnergyRentOrderRef,
  EnergyRentQuote,
  EnergyRentRequest,
  EnergyRentSignedTransaction,
  EnergyRentStatus,
} from "./types";

export * from "./types";

/** Resolve the energy-rent provider selected in coin-config (the single provider dispatch point). */
export function getEnergyProvider(): EnergyProvider {
  const energyRent = coinConfig.getCoinConfig().energyRent;
  if (!energyRent) {
    throw new EnergyRentProviderNotConfigured("No energy-rent provider configured");
  }
  if (energyRent.provider === "tronify") {
    return tronifyProvider;
  }
  // `provider` comes from remote coin-config, so guard against an unknown value at runtime.
  throw new EnergyRentProviderNotConfigured(
    `Unsupported energy-rent provider: ${energyRent.provider}`,
  );
}

export function getEnergyRentQuote(request: EnergyRentRequest): Promise<EnergyRentQuote> {
  return getEnergyProvider().getQuote(request);
}

/**
 * Reject an order that would charge more than the amount already approved. Pricing
 * (`getQuote`) and ordering (`createOrder`) are independent provider calls that each return their
 * own `payCoinAmt`, so without this the device could be handed payment bytes for a different (or
 * arbitrarily larger) sum than the one the user agreed to, with the device screen as the only
 * remaining backstop. No ceiling on the request means no approved amount to check against.
 */
function assertOrderWithinApprovedCost(request: EnergyRentRequest, order: EnergyRentOrder): void {
  const { maxPayCoinAmt, maxPayCoinCode } = request;
  if (maxPayCoinAmt === undefined) return;

  if (maxPayCoinCode !== undefined && order.payCoinCode !== maxPayCoinCode) {
    throw new TronifyApiError(
      `Energy-rent order is priced in ${String(order.payCoinCode)}, but ${maxPayCoinCode} was approved`,
    );
  }

  const approved = new BigNumber(maxPayCoinAmt);
  const charged = new BigNumber(order.payCoinAmt);
  // An unparseable amount is not "within budget" — a non-numeric payCoinAmt would otherwise slip
  // through every comparison below as false.
  if (!approved.isFinite() || !charged.isFinite() || charged.isNegative()) {
    throw new TronifyApiError(
      `Cannot verify energy-rent cost: approved "${maxPayCoinAmt}", order returned "${order.payCoinAmt}"`,
    );
  }
  if (charged.isGreaterThan(approved)) {
    throw new TronifyApiError(
      `Energy-rent order costs ${order.payCoinAmt}, above the approved ${maxPayCoinAmt}`,
    );
  }
}

export async function craftEnergyRentTransaction(
  request: EnergyRentRequest,
): Promise<EnergyRentOrder> {
  const order = await getEnergyProvider().createOrder(request);
  assertOrderWithinApprovedCost(request, order);
  return order;
}

export function broadcastEnergyRentTransaction(payment: {
  orderId: string;
  signedTransaction: EnergyRentSignedTransaction;
}): Promise<void> {
  return getEnergyProvider().submitPayment(payment);
}

export function getEnergyRentStatus(order: EnergyRentOrderRef): Promise<EnergyRentStatus> {
  return getEnergyProvider().getOrderStatus(order);
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Rejection marker for a poll that outlived the hard deadline; never escapes this module. */
const POLL_DEADLINE_REACHED = Symbol("energy-rent-poll-deadline");

/**
 * The deadline is enforced even while the request is in flight — a hung status call would otherwise
 * keep the poll pending forever and the hard timeout would never fire. The timer is cleared once
 * the race settles so nothing stays scheduled.
 */
function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(POLL_DEADLINE_REACHED), ms);
  });
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Poll an energy-rent order until the delegated energy is delivered on-chain. Resolves on
 * "delivered"; throws TronifyApiError on "failed"; throws EnergyDelegationTimeoutError once the
 * hard timeout passes — including while a status request is still in flight. `getStatus` is
 * injected so callers/tests can drive it without the network.
 *
 * The caller has already paid for the rental by the time we poll, so a transient status failure
 * must not abandon it: rejections are tolerated up to `maxConsecutiveErrors` in a row (reset by any
 * successful read) and only then surfaced. An explicit "failed" status is a verdict, not a blip,
 * and still throws immediately.
 */
export async function awaitEnergyDeliveryWith(
  getStatus: () => Promise<EnergyRentStatus>,
  opts?: {
    intervalMs?: number;
    timeoutMs?: number;
    paymentTxId?: string;
    maxConsecutiveErrors?: number;
  },
): Promise<void> {
  const intervalMs = opts?.intervalMs ?? ENERGY_RENT_POLL_INTERVAL_MS;
  const timeoutMs = opts?.timeoutMs ?? ENERGY_RENT_POLL_TIMEOUT_MS;
  const maxConsecutiveErrors =
    opts?.maxConsecutiveErrors ?? ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS;
  const deadline = Date.now() + timeoutMs;
  const timedOut = () =>
    new EnergyDelegationTimeoutError("Energy delivery timed out", {
      paymentTxId: opts?.paymentTxId,
    });
  const remaining = () => deadline - Date.now();

  let consecutiveErrors = 0;
  for (;;) {
    if (remaining() <= 0) throw timedOut();

    let status: EnergyRentStatus;
    try {
      status = await withDeadline(getStatus(), remaining());
    } catch (error) {
      if (error === POLL_DEADLINE_REACHED) throw timedOut();
      if (++consecutiveErrors >= maxConsecutiveErrors) throw error;
      await delay(Math.min(intervalMs, Math.max(remaining(), 0)));
      continue;
    }

    consecutiveErrors = 0;
    if (status === "delivered") return;
    if (status === "failed") throw new TronifyApiError("Energy rent order failed");
    await delay(Math.min(intervalMs, Math.max(remaining(), 0)));
  }
}

/** Bound form: polls `getEnergyRentStatus(ref)` until delivery. */
export function awaitEnergyDelivery(
  ref: EnergyRentOrderRef,
  opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string },
): Promise<void> {
  return awaitEnergyDeliveryWith(() => getEnergyRentStatus(ref), opts);
}
