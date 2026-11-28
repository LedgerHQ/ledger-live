import BigNumber from "bignumber.js";
import { utils } from "tronweb";
import { EnergyRentSignatureMismatch, TronifyApiError } from "../../types/errors";
import { recoverDeviceSignature } from "../combine";
import { decodeRawData, tronTxIdFromRawDataHex } from "../utils";
import {
  TRONIFY_PAY_ASSET,
  payAssetBaseUnits,
  tronifyPayAsset,
  type SponsoredFeeAsset,
} from "../constants";
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

/**
 * Requires the payment to be signed by its owner key, which crafting bound to the payer. It does
 * not prove the network accepts it: an account whose owner permission was changed (multisig) can
 * still reject it.
 */
function assertSignedByOwner(rawDataHex: string, signature: string): void {
  let owner: unknown;
  let signer: string;
  try {
    const contracts: unknown[] = decodeRawData(rawDataHex).contract ?? [];
    owner =
      contracts.length === 1
        ? (contracts[0] as { parameter?: { value?: { owner_address?: unknown } } }).parameter?.value
            ?.owner_address
        : undefined;
    // Recovered over the hash of the bytes themselves, not the provider's `txID`.
    signer = utils.crypto.ecRecover(tronTxIdFromRawDataHex(rawDataHex), signature);
  } catch (cause) {
    throw new EnergyRentSignatureMismatch("Cannot check who signed the energy-rent payment", {
      cause,
    });
  }
  if (typeof owner !== "string" || signer.toLowerCase() !== owner.toLowerCase()) {
    throw new EnergyRentSignatureMismatch(
      "Energy-rent payment is not signed by the account that pays it",
    );
  }
}

/** Inverse of `combine`: rebuilds the Tronify-signed payload the generic flow can't, since the wire
 * shape is coin-tron's. */
export function buildSignedEnergyRentTransaction(
  transaction: EnergyRentUnsignedTransaction,
  combinedSignature: string,
): EnergyRentSignedTransaction {
  const signature = recoverDeviceSignature(transaction.raw_data_hex, combinedSignature);
  assertSignedByOwner(transaction.raw_data_hex, signature);
  return { ...transaction, signature: [signature] };
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
export function rentPayment(order: EnergyRentOrder): { asset: SponsoredFeeAsset; amount: bigint } {
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
