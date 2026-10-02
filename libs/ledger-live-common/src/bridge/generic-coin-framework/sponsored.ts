import { findCryptoCurrencyByNetwork } from "./utils";
import { loadSponsoredApiForFamily } from "../../coin-modules/registry";
import type { AssetInfo, FeeOptionMeta } from "@ledgerhq/coin-module-framework/api/index";

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

/** The asset a sponsored fee is paid in; re-exported so apps don't import the framework for it. */
export type SponsoredFeeAsset = AssetInfo;

/** `value` is in `feeAsset` base units; `originalValue` is the standard fee it replaces, in the
 * network's native base units. No delta: the two can be in different units. */
export type SponsoredFeeQuote = {
  feeAsset: SponsoredFeeAsset;
  value: bigint;
  originalValue: bigint;
};

/** The rent payment the app locks against the payer until it syncs. */
export type RentPayment = { asset: SponsoredFeeAsset; amount: bigint };

/** Models TRON energy rental only; not validated against a second mechanism. */
export interface SponsoredCoinApi {
  readonly feeOptionId: string;
  readonly providerName: string;
  /** Status error keys the sponsored fee pays for; the Send flow drops them before gating Review. */
  readonly waivesErrorKeys: readonly string[];
  /** Status warning keys the sponsored fee makes moot; the Send flow hides them. */
  readonly waivesWarningKeys: readonly string[];
  /** Decimal-string sequence for the TX-A pending reservation: a local dedup key, not a nonce. */
  reservationDedupKey(paymentTxId: string): string;
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
  rentPayment(order: EnergyRentOrder): RentPayment;
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
