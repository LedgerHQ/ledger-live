import { BigNumber } from "bignumber.js";
import { PsbtV2 } from "@ledgerhq/hw-app-btc/newops/psbtv2";
// NOTE: could exist in hw-app-btc and only export the feeFromPsbtBase64 fn from there

/** normalize possible inputs: base64 (with whitespace/URL-safe), or raw hex */
function normalizeToBuffer(psbtMaybe: string): Buffer | null {
  if (!psbtMaybe) return null;
  const s = psbtMaybe.trim();

  // If hex (even length, only [0-9a-fA-F]) → treat as hex
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
    try {
      return Buffer.from(s, "hex");
    } catch {
      /* ignore */
    }
  }

  // Treat as base64: strip whitespace and convert URL-safe to standard
  const b64 = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  // pad base64
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;

  try {
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

/** read uint64 little-endian into JS number (safe for BTC amounts) */
function readUInt64LE(buf: Buffer): number {
  const lo = buf.readUInt32LE(0);
  const hi = buf.readUInt32LE(4);
  return lo + hi * 4294967296;
}

/**
 * Compute fee from a PSBT (v2 preferred).
 * Returns:
 *  - BigNumber(fee) on success
 *  - null if cannot parse (caller should fallback to calculateFees()).
 */
export function feeFromPsbtBase64(psbtStr: string): BigNumber | null {
  const buf = normalizeToBuffer(psbtStr);
  if (!buf || buf.length < 5) return null;

  // Expect magic "psbt\xff" = 70 73 62 74 ff
  const isPsbtMagic =
    buf[0] === 0x70 && buf[1] === 0x73 && buf[2] === 0x62 && buf[3] === 0x74 && buf[4] === 0xff;
  if (!isPsbtMagic) {
    // Not a PSBT container — bail out silently so caller can fallback
    return null;
  }

  try {
    const psbt = new PsbtV2();
    psbt.deserialize(buf);

    // Sum inputs (prefer WITNESS_UTXO; if only NON_WITNESS_UTXO is present, return null)
    let inSum = 0n;
    const nIn: number = psbt.getGlobalInputCount();
    for (let i = 0; i < nIn; i++) {
      const w = psbt.getInputWitnessUtxo(i);
      if (w) {
        inSum += BigInt(readUInt64LE(w.amount));
        continue;
      }
      // Non-witness-only not handled here (requires prev-tx reader)
      if (psbt.getInputNonWitnessUtxo(i)) return null;
      return null;
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
