/**
 * Quantova post-quantum signature scheme registry.
 *
 * Every Quantova account is secured by ONE of three NIST post-quantum signature schemes.
 * The on-chain `QSignature` is a SCALE enum whose variant index selects the scheme; the
 * parameters below mirror the runtime exactly (`primitives/account`):
 *
 *   variant  scheme       NIST std            pubkey   sig (max)   on-chain types
 *   0        SPHINCS+     SLH-DSA  (FIPS 205)  32 B     7856 B      sphincsp::Public / SphincsSignatureBytes
 *   1        Falcon       FN-DSA   (FIPS 206)  897 B    754 B       falcon::Public    / FalconSignatureBytes
 *   2        Dilithium    ML-DSA   (FIPS 204)  1312 B   2420 B      dilithium::Public / DilithiumSignatureBytes
 *
 * The address is derived from the public key: SHA3-256(pubkey)[0..20], byte0 = 0x40.
 */

export enum QScheme {
  SPHINCS = "sphincsp",
  FALCON = "falcon",
  DILITHIUM = "dilithium",
}

export type QSchemeParams = {
  /** SCALE enum variant index used on-chain in `QSignature`. */
  variant: 0 | 1 | 2;
  /** Display label. */
  label: string;
  /** NIST standard name. */
  nist: string;
  /** Public-key length in bytes (fixed). */
  publicKeyLength: number;
  /** Maximum signature length in bytes (BoundedVec bound on-chain). */
  maxSignatureLength: number;
  /**
   * Rough Secure-Element friendliness for an eventual on-device app.
   * Dilithium is the most SE-tractable of the three; SPHINCS+ signatures are the
   * largest. This guides which scheme a first `app-quantova` would target.
   */
  seFriendliness: "best" | "moderate" | "hard";
};

export const QSCHEMES: Record<QScheme, QSchemeParams> = {
  [QScheme.SPHINCS]: {
    variant: 0,
    label: "SPHINCS+",
    nist: "SLH-DSA (FIPS 205)",
    publicKeyLength: 32,
    maxSignatureLength: 7856,
    seFriendliness: "hard",
  },
  [QScheme.FALCON]: {
    variant: 1,
    label: "Falcon",
    nist: "FN-DSA (FIPS 206)",
    publicKeyLength: 897,
    maxSignatureLength: 754,
    seFriendliness: "moderate",
  },
  [QScheme.DILITHIUM]: {
    variant: 2,
    label: "Dilithium",
    nist: "ML-DSA (FIPS 204)",
    publicKeyLength: 1312,
    maxSignatureLength: 2420,
    seFriendliness: "best",
  },
};

/** Map a SCALE variant byte (0/1/2) back to its scheme. */
export function schemeFromVariant(variant: number): QScheme {
  const found = (Object.values(QScheme) as QScheme[]).find(s => QSCHEMES[s].variant === variant);
  if (!found) throw new Error(`unknown QSignature variant ${variant}`);
  return found;
}
