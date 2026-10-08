import { secp256k1 } from "@noble/curves/secp256k1";
import { p256 } from "@noble/curves/nist";
import { sha256 } from "@noble/hashes/sha2";
import { base64UrlDecode } from "./shared-utils";

/**
 * Partner public key used to verify a Swap NG payload signature.
 */
export type SwapNgPartnerPublicKey = {
  curve: "secp256k1" | "secp256r1";
  data: Uint8Array;
};

/**
 * Result of `classifySwapNgSignature`.
 *
 * - `valid`: verifies over `"." + payload`, the input the Exchange app hashes. The
 *   `valid_leading_zero_*` variants flag an r and/or s starting with 0x00, a known firmware
 *   R/S-to-DER edge case the device may still reject.
 * - `signed_without_dot_prefix`: verifies over the payload without the "." prefix.
 * - `signed_raw_protobuf`: verifies over the decoded protobuf bytes.
 * - `invalid`: verifies over none of the above.
 * - `signature_malformed`: not a 64-byte compact r||s, or r or s is 0 or not below the curve order.
 */
export type SwapNgSignatureClassification =
  | "valid"
  | "valid_leading_zero_r"
  | "valid_leading_zero_s"
  | "valid_leading_zero_rs"
  | "signed_without_dot_prefix"
  | "signed_raw_protobuf"
  | "invalid"
  | "signature_malformed";

const curveOf = (curve: SwapNgPartnerPublicKey["curve"]) =>
  curve === "secp256r1" ? p256 : secp256k1;

export function isValidSwapNgPartnerPublicKey(publicKey: SwapNgPartnerPublicKey): boolean {
  try {
    curveOf(publicKey.curve).Point.fromBytes(Uint8Array.from(publicKey.data));
    return true;
  } catch {
    return false;
  }
}

/**
 * @ignore internal, verifies a 64-byte compact r||s signature over SHA-256(message) like the
 * Exchange app, which accepts high-S signatures. Throws when r or s is 0 or not below the curve order.
 */
export function verifyCompactSignature(
  publicKey: SwapNgPartnerPublicKey,
  compactSignature: Uint8Array,
  message: Uint8Array,
): boolean {
  return curveOf(publicKey.curve).verify(
    compactSignature,
    sha256(message),
    Uint8Array.from(publicKey.data),
    { prehash: false, lowS: false, format: "compact" },
  );
}

/**
 * Classifies a Swap NG partner signature against the inputs a partner backend may have signed.
 * Never throws.
 *
 * @param payload base64url `NewTransactionResponse`, without its "." prefix
 * @param signature base64url of the 64-byte compact r||s signature
 */
export function classifySwapNgSignature(
  payload: string,
  signature: string,
  publicKey: SwapNgPartnerPublicKey,
): SwapNgSignatureClassification {
  try {
    const compactSignature = base64UrlDecode(signature);
    if (compactSignature.length !== 64) return "signature_malformed";

    const verifies = (message: Uint8Array): boolean =>
      verifyCompactSignature(publicKey, compactSignature, message);

    if (verifies(Buffer.from("." + payload))) {
      const rLeadingZero = compactSignature[0] === 0x00;
      const sLeadingZero = compactSignature[32] === 0x00;
      if (rLeadingZero && sLeadingZero) return "valid_leading_zero_rs";
      if (rLeadingZero) return "valid_leading_zero_r";
      if (sLeadingZero) return "valid_leading_zero_s";
      return "valid";
    }
    if (verifies(Buffer.from(payload))) return "signed_without_dot_prefix";
    if (verifies(base64UrlDecode(payload))) return "signed_raw_protobuf";
    return "invalid";
  } catch {
    return "signature_malformed";
  }
}
