import BigNumber from "bignumber.js";
import { recoverDeviceSignature } from "../combine";
import { SUN_PER_TRX } from "../constants";
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

/** Sun the platform should lock against the payer's balance until TX-A syncs. Rounds up: a sub-sun
 * quote must never under-reserve the lock. */
export function nativeRentAmount(order: EnergyRentOrder): bigint {
  return BigInt(
    new BigNumber(order.payCoinAmt).times(SUN_PER_TRX).toFixed(0, BigNumber.ROUND_CEIL),
  );
}
