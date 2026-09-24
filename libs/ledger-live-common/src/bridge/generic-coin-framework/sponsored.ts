import { findCryptoCurrencyByNetwork } from "./utils";
import { loadSponsoredApiForFamily } from "../../coin-modules/registry";
import type { FeeOptionMeta } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Repo-local seam for sponsored sends (TRON Tronify energy rental). The coin-module contract lives
 * in the external @ledgerhq/coin-module-framework package, so these methods can't be declared on it
 * from here; a family exposes them through its own factory (coin-tron's createSponsoredSendApi),
 * registered as the registry's `loadSponsoredApi` and reached through this accessor — the family's
 * main coin-module api stays exactly the generic contract. Types are declared structurally (the
 * family's factory return satisfies them) so the generic bridge takes no dependency on a specific
 * family. When the framework contract gains these methods, replace this interface with the contract
 * type — a lift-and-move.
 */

export type EnergyRentStatus = "pending" | "paid" | "delivered" | "failed" | "unknown";

export type EnergyRentRequest = {
  payerAddress: string;
  receiverAddress: string;
  energy: bigint;
  durationSeconds: number;
  extraTrx?: number;
  // The approved cost ceiling the family enforces at craft time (assertOrderWithinApprovedCost);
  // tracked across the seam so a reconstructed request can't silently drop it and re-open unbounded ordering.
  maxPayCoinAmt?: string;
  maxPayCoinCode?: string;
};

export type EnergyRentOrder = {
  orderId: string;
  /** Unsigned payment tx to sign (opaque at the seam). */
  transaction: unknown;
  payCoinCode: string;
  payCoinAmt: string;
};

export type EnergyRentOrderRef = { orderId: string; payerAddress: string };

/** TRX-denominated savings quote for the fee nudge: the sponsored cost, the standard burn it
 * replaces, and the (clamped) delta. */
export type SponsoredFeeQuote = { value: bigint; originalValue: bigint; savings: bigint };

export interface SponsoredCoinApi {
  listFeeOptions(intent: unknown): Promise<FeeOptionMeta[]>;
  estimateSponsoredFeeQuote(intent: unknown): Promise<SponsoredFeeQuote>;
  buildEnergyRentRequest(intent: unknown): Promise<EnergyRentRequest>;
  craftEnergyRentTransaction(request: EnergyRentRequest): Promise<EnergyRentOrder>;
  submitEnergyRentPayment(payment: { orderId: string; signedTransaction: unknown }): Promise<void>;
  getEnergyRentStatus(ref: EnergyRentOrderRef): Promise<EnergyRentStatus>;
  awaitEnergyDelivery(
    ref: EnergyRentOrderRef,
    // The on-chain delivery gate: the family polls `receiverAddress`'s live resource state until it
    // holds `energyNeeded`, rather than trusting the provider's order status (ADR-058 C4).
    target: { receiverAddress: string; energyNeeded: bigint },
    // `signal` lets the caller stop the poll when the Send flow is reset/unmounted, so it doesn't keep
    // hitting the network until the timeout for a result that will be discarded.
    opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string; signal?: AbortSignal },
  ): Promise<void>;
  // One-shot form of the on-chain gate for the reconcile paths (submit-reject / poll-timeout): true
  // only when `receiverAddress` already holds `energyNeeded` on-chain, so the provider's advisory
  // "delivered" is never trusted to release TX-C on its own (ADR-058 C4).
  isEnergyDelivered(target: { receiverAddress: string; energyNeeded: bigint }): Promise<boolean>;
  // Family-owned wire transforms so the generic Send flow never handles the opaque `transaction`:
  // the hex + payment id the device must sign, the signed-payload rebuild from the device's combined
  // signature, and the native smallest-unit amount to reserve while TX-A is unconfirmed.
  getEnergyRentSignaturePayload(transaction: unknown): { toSign: string; paymentTxId: string };
  buildSignedEnergyRentTransaction(transaction: unknown, deviceSignature: string): unknown;
  nativeRentAmount(order: EnergyRentOrder): bigint;
}

/**
 * Resolve the sponsored-send seam for a currency, or null when the family doesn't implement it
 * (every non-TRON module) — it has no `loadSponsoredApi` registered, so the registry resolves to
 * undefined. Sponsored sends exist only through a family's local coin-module, so only `kind ===
 * "local"` can yield one; any other kind returns null.
 *
 * `network`/`kind` mirror getCoinModuleApi's own params (network id, plus "local" | the
 * network-coin-service kind). Pass the chain/network id, not a token's own currency id.
 */
export async function getSponsoredCoinApi(
  network: string,
  kind: string,
): Promise<SponsoredCoinApi | null> {
  if (kind !== "local") return null;
  const currency = findCryptoCurrencyByNetwork(network);
  const createSponsoredApi = currency && (await loadSponsoredApiForFamily(currency.family));
  return createSponsoredApi ? createSponsoredApi(currency.id) : null;
}
