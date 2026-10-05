import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { TronifyApiError } from "../../types/errors";
import { recoverDeviceSignature } from "../combine";
import { TRONIFY_PAY_ASSET, payAssetBaseUnits, tronifyPayAsset } from "../constants";
import type {
  EnergyRentOrder,
  EnergyRentSignedTransaction,
  EnergyRentUnsignedTransaction,
} from "./types";

/** Lets the generic sponsored flow drive signing without knowing coin-tron's Tronify wire shape. */
export function getEnergyRentSignaturePayload(transaction: EnergyRentUnsignedTransaction): {
  toSign: string;
  paymentTxId: string;
} {
  return { toSign: transaction.raw_data_hex, paymentTxId: transaction.txID };
}

/** Inverse of `combine`: rebuilds the Tronify-signed payload the generic flow can't, since the wire
 * shape is coin-tron's. */
export function buildSignedEnergyRentTransaction(
  transaction: EnergyRentUnsignedTransaction,
  combinedSignature: string,
): EnergyRentSignedTransaction {
  return {
    ...transaction,
    signature: [recoverDeviceSignature(transaction.raw_data_hex, combinedSignature)],
  };
}

/** Local dedup key for the pending TX-A reservation; TRON has no nonce. Non-integer so the generic
 * next-nonce calc never adopts it, and > 0 so it never collides with the sequence-0 ops. */
export function reservationDedupKey(paymentTxId: string): string {
  const hex = [...paymentTxId]
    .map(ch => (ch.codePointAt(0) ?? 0).toString(16).padStart(4, "0"))
    .join("");
  return new BigNumber(hex, 16).plus(0.5).toFixed();
}

/** What the platform should lock against the payer's USDT until TX-A syncs: the order's rent in USDT
 * base units, rounded up so a sub-unit quote never under-reserves the lock. */
export function rentPayment(order: EnergyRentOrder): { asset: AssetInfo; amount: bigint } {
  const amount = payAssetBaseUnits(order.payCoinAmt);
  if (
    String(order.payCoinCode).toUpperCase() !== TRONIFY_PAY_ASSET.unit.code ||
    !amount.isFinite() ||
    !amount.isGreaterThan(0)
  ) {
    throw new TronifyApiError(
      `Cannot reserve an energy-rent payment of ${order.payCoinAmt} ${String(order.payCoinCode)}`,
    );
  }
  return { asset: tronifyPayAsset(), amount: BigInt(amount.toFixed()) };
}
