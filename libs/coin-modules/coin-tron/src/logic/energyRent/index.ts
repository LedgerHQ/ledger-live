import coinConfig from "../../config";
import {
  EnergyDelegationTimeoutError,
  EnergyRentProviderNotConfigured,
  TronifyApiError,
} from "../../types/errors";
import { ENERGY_RENT_POLL_INTERVAL_MS, ENERGY_RENT_POLL_TIMEOUT_MS } from "../constants";
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

export function craftEnergyRentTransaction(request: EnergyRentRequest): Promise<EnergyRentOrder> {
  return getEnergyProvider().createOrder(request);
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

/**
 * Poll an energy-rent order until the delegated energy is delivered on-chain. Resolves on
 * "delivered"; throws TronifyApiError on "failed"; throws EnergyDelegationTimeoutError once the
 * hard timeout passes. `getStatus` is injected so callers/tests can drive it without the network.
 */
export async function awaitEnergyDeliveryWith(
  getStatus: () => Promise<EnergyRentStatus>,
  opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string },
): Promise<void> {
  const intervalMs = opts?.intervalMs ?? ENERGY_RENT_POLL_INTERVAL_MS;
  const timeoutMs = opts?.timeoutMs ?? ENERGY_RENT_POLL_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const status = await getStatus();
    if (status === "delivered") return;
    if (status === "failed") throw new TronifyApiError("Energy rent order failed");
    if (Date.now() >= deadline) {
      throw new EnergyDelegationTimeoutError("Energy delivery timed out", {
        paymentTxId: opts?.paymentTxId,
      });
    }
    await delay(intervalMs);
  }
}

/** Bound form: polls `getEnergyRentStatus(ref)` until delivery. */
export function awaitEnergyDelivery(
  ref: EnergyRentOrderRef,
  opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string },
): Promise<void> {
  return awaitEnergyDeliveryWith(() => getEnergyRentStatus(ref), opts);
}
