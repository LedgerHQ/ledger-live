import { getCoinModuleApi } from "./api";
import type { FeeOptionMeta } from "@ledgerhq/coin-module-framework/api/index";

/**
 * Repo-local seam for sponsored sends (TRON Tronify energy rental). The coin-module contract lives
 * in the external @ledgerhq/coin-module-framework package, so these methods can't be declared on it
 * from here; they ride on coin-tron's concrete createApi() as extra members and are reached through
 * this presence-guarded accessor. Types are declared structurally (coin-tron's returns satisfy them)
 * so the generic bridge takes no dependency on a specific family. When the framework contract gains
 * these methods, replace this interface with the contract type — a lift-and-move.
 */
/** The fee-option id coin-tron advertises for a Tronify-sponsored send (mirrors coin-tron's
 * `TRONIFY_FEE_OPTION_ID`); the app matches `listFeeOptions()` results against this without importing
 * coin-tron. */
export const SPONSORED_FEE_OPTION_ID = "tronify" as const;

export type EnergyRentStatus = "pending" | "paid" | "delivered" | "failed" | "unknown";

export type EnergyRentRequest = {
  payerAddress: string;
  receiverAddress: string;
  energy: bigint;
  durationSeconds: number;
  extraTrx?: number;
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
    opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string },
  ): Promise<void>;
}

const SEAM_METHODS = [
  "listFeeOptions",
  "estimateSponsoredFeeQuote",
  "buildEnergyRentRequest",
  "craftEnergyRentTransaction",
  "submitEnergyRentPayment",
  "getEnergyRentStatus",
  "awaitEnergyDelivery",
] as const;

/**
 * Resolve the sponsored-send seam for a currency, or null when the family doesn't implement it
 * (every non-TRON module). Presence-guarded: every SEAM_METHODS entry must be a function.
 *
 * `network`/`kind` mirror getCoinModuleApi's own params exactly (network id, plus "local" | the
 * network-coin-service kind) so this is a thin pass-through to the same resolver the rest of the
 * generic bridge uses. Pass the chain/network id (e.g. `mainAccount.currency.id`), not a token's
 * own currency id.
 */
export async function getSponsoredCoinApi(
  network: string,
  kind: string,
): Promise<SponsoredCoinApi | null> {
  const api = (await getCoinModuleApi(network, kind)) as Partial<SponsoredCoinApi> &
    Record<string, unknown>;
  const complete = SEAM_METHODS.every(m => typeof api[m] === "function");
  return complete ? (api as unknown as SponsoredCoinApi) : null;
}
