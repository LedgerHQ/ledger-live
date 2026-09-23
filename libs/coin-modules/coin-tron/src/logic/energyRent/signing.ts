import BigNumber from "bignumber.js";
import { recoverDeviceSignature } from "../combine";
import { SUN_PER_TRX } from "../constants";
import type {
  EnergyRentOrder,
  EnergyRentSignedTransaction,
  EnergyRentUnsignedTransaction,
} from "./types";

/**
 * The device-signable payload for an energy-rent order's unsigned payment tx: the hex the device signs
 * (`raw_data_hex`) and TX-A's id (`txID`, stable across signing). Lets the generic sponsored flow drive
 * the signature and native reservation without knowing coin-tron's Tronify wire shape.
 */
export function getEnergyRentSignaturePayload(transaction: EnergyRentUnsignedTransaction): {
  toSign: string;
  paymentTxId: string;
} {
  return { toSign: transaction.raw_data_hex, paymentTxId: transaction.txID };
}

/**
 * Rebuild the Tronify-signed payment payload from the device's combined signature — the inverse-of-
 * `combine` reconstruction the generic flow can't do because the wire shape is coin-tron's.
 */
export function buildSignedEnergyRentTransaction(
  transaction: EnergyRentUnsignedTransaction,
  combinedSignature: string,
): EnergyRentSignedTransaction {
  return {
    ...transaction,
    signature: [recoverDeviceSignature(transaction.raw_data_hex, combinedSignature)],
  };
}

/**
 * Native amount (in sun) the rent payment debits, for the platform to lock against the payer's balance
 * until TX-A syncs. TX-A is always a native-TRX debit, so `payCoinAmt` (TRX) converts by SUN_PER_TRX;
 * the generic reservation layer stays unit-agnostic and receives smallest-unit sun.
 */
export function nativeRentAmount(order: EnergyRentOrder): bigint {
  return BigInt(new BigNumber(order.payCoinAmt).times(SUN_PER_TRX).toFixed(0));
}
