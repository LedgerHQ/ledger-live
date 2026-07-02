import type { Signature } from "viem";
import { parseTransaction, serializeTransaction } from "viem/celo";

/** Signature object shape returned by the Ledger device / DMK (`r`/`s` may be unprefixed, `v` is a hex string or number). */
type DeviceSignature = { r: string; s: string; v: string | number };

const prefix = (hex: string): `0x${string}` =>
  (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;

/** Map a transaction `v` to the `yParity` used by typed (eip1559/cip64) transactions. */
const vToYParity = (v: bigint): number => {
  if (v === 0n || v === 1n) return Number(v);
  if (v === 27n || v === 28n) return Number(v - 27n);
  throw new Error(`celo: unsupported signature v value: ${v}`);
};

const normalizeSignature = (signature: string | DeviceSignature): Signature => {
  if (typeof signature === "string") {
    const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
    if (hex.length < 130) {
      throw new Error("celo: signature string must encode r, s and v (65 bytes)");
    }
    return {
      r: prefix(hex.slice(0, 64)),
      s: prefix(hex.slice(64, 128)),
      // take the whole remainder as `v` (not just one byte) so a multi-byte value
      // fails loudly in vToYParity rather than being silently truncated
      yParity: vToYParity(BigInt(prefix(hex.slice(128)))),
    };
  }

  // A numeric `v` is decimal; a string `v` is hex, as the device returns it.
  const v = typeof signature.v === "number" ? BigInt(signature.v) : BigInt(prefix(signature.v));
  return {
    r: prefix(signature.r),
    s: prefix(signature.s),
    yParity: vToYParity(v),
  };
};

/**
 * Combines an unsigned, serialized Celo transaction (from `craftTransaction`)
 * with a device signature into the signed, serialized transaction passed to
 * `broadcast`.
 *
 * Uses `viem/celo` so both EIP-1559 and CIP-64 (fee-currency) transactions
 * round-trip with their correct type byte preserved — ethers cannot parse the
 * CIP-64 `0x7b` type.
 */
export const combine = (tx: string, signature: string | DeviceSignature): string => {
  const parsed = parseTransaction(prefix(tx));
  return serializeTransaction(parsed, normalizeSignature(signature));
};

export default combine;
