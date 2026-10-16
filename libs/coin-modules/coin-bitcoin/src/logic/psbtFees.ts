import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { PsbtV2 } from "@ledgerhq/psbtv2";

/** read uint64 little-endian into JS number (safe for BTC amounts) */
function readUInt64LE(buf: Buffer): bigint {
  const lo = buf.readUInt32LE(0);
  const hi = buf.readUInt32LE(4);
  const loBig = BigInt(lo);
  const hiBig = BigInt(hi);
  const value = loBig + (hiBig << 32n);

  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("readUInt64LE: value exceeds Number.MAX_SAFE_INTEGER");
  }

  return value;
}

/**
 * Compute fee from a PSBT (v2 preferred).
 * Returns:
 *  - BigNumber(fee) on success
 *  - null if cannot parse (caller should fallback to calculateFees()).
 */
export function feeFromPsbt(buf: Buffer): BigNumber | null {
  if (!buf || buf.length < 5) return null;

  try {
    // Check PSBT version and use appropriate deserialization method
    const psbtVersion = PsbtV2.getPsbtVersionNumber(buf);
    const psbt = psbtVersion === 2 ? new PsbtV2() : PsbtV2.fromV0(buf, true);

    if (psbtVersion === 2) {
      psbt.deserialize(buf);
    }

    // Sum inputs (prefer WITNESS_UTXO; fall back to NON_WITNESS_UTXO)
    let inSum = 0n;
    const nIn: number = psbt.getGlobalInputCount();
    for (let i = 0; i < nIn; i++) {
      const w = psbt.getInputWitnessUtxo(i);
      if (w) {
        inSum += readUInt64LE(w.amount);
        continue;
      }
      const nonWitness = psbt.getInputNonWitnessUtxo(i);
      if (!nonWitness) {
        return null;
      }

      // NON_WITNESS_UTXO is the full previous transaction. Use the PSBT
      // input's referenced output index to locate the amount.
      const prevTx = Transaction.fromBuffer(nonWitness);
      const prevOutIndex = psbt.getInputOutputIndex(i);

      const prevOut = prevTx.outs[prevOutIndex];
      if (!prevOut) {
        return null;
      }

      inSum += BigInt(prevOut.value);
    }

    // Sum outputs
    let outSum = 0n;
    const nOut: number = psbt.getGlobalOutputCount();
    for (let i = 0; i < nOut; i++) {
      outSum += BigInt(psbt.getOutputAmount(i)); // number
    }

    if (inSum < outSum) return null;
    return new BigNumber((inSum - outSum).toString());
  } catch {
    return null;
  }
}
