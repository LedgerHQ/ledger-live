import { findCryptoCurrencyByNetwork } from "./utils";
import { loadSponsoredApiForFamily } from "../../coin-modules/registry";
import type { FeeOptionMeta } from "@ledgerhq/coin-module-framework/api/index";

export type EnergyRentStatus = "pending" | "paid" | "delivered" | "failed" | "unknown";

export type EnergyRentRequest = {
  payerAddress: string;
  receiverAddress: string;
  energy: bigint;
  durationSeconds: number;
  extraTrx?: number;
  // Cost ceiling from assertOrderWithinApprovedCost; drop it and ordering is unbounded.
  maxPayCoinAmt?: string;
  maxPayCoinCode?: string;
};

export type EnergyRentOrder = {
  orderId: string;
  transaction: unknown;
  payCoinCode: string;
  payCoinAmt: string;
};

export type EnergyRentOrderRef = { orderId: string; payerAddress: string };

/** TRX-denominated: sponsored cost, standard burn it replaces, and the (clamped) delta. */
export type SponsoredFeeQuote = { value: bigint; originalValue: bigint; savings: bigint };

/** Models TRON energy rental only; not validated against a second mechanism. */
export interface SponsoredCoinApi {
  listFeeOptions(intent: unknown): Promise<FeeOptionMeta[]>;
  estimateSponsoredFeeQuote(intent: unknown): Promise<SponsoredFeeQuote>;
  buildEnergyRentRequest(intent: unknown): Promise<EnergyRentRequest>;
  craftEnergyRentTransaction(request: EnergyRentRequest): Promise<EnergyRentOrder>;
  submitEnergyRentPayment(payment: { orderId: string; signedTransaction: unknown }): Promise<void>;
  getEnergyRentStatus(ref: EnergyRentOrderRef): Promise<EnergyRentStatus>;
  awaitEnergyDelivery(
    ref: EnergyRentOrderRef,
    // On-chain delivery gate: polls the live resource state rather than trusting order status (ADR-058 C4).
    target: { receiverAddress: string; energyNeeded: bigint },
    opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string; signal?: AbortSignal },
  ): Promise<void>;
  // One-shot on-chain check for reconcile paths; the provider's "delivered" is never trusted alone (ADR-058 C4).
  isEnergyDelivered(target: { receiverAddress: string; energyNeeded: bigint }): Promise<boolean>;
  // Family-owned so the generic Send flow never handles the opaque `transaction` directly.
  getEnergyRentSignaturePayload(transaction: unknown): { toSign: string; paymentTxId: string };
  buildSignedEnergyRentTransaction(transaction: unknown, deviceSignature: string): unknown;
  nativeRentAmount(order: EnergyRentOrder): bigint;
}

/** Null unless `kind` is "local" and the family registers a sponsored seam. Pass the network id, not a token's currency id. */
export async function getSponsoredCoinApi(
  network: string,
  kind: string,
): Promise<SponsoredCoinApi | null> {
  if (kind !== "local") return null;
  const currency = findCryptoCurrencyByNetwork(network);
  const createSponsoredApi = currency && (await loadSponsoredApiForFamily(currency.family));
  return createSponsoredApi ? createSponsoredApi(currency.id) : null;
}
