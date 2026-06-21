/**
 * Quantova device-signer contract.
 *
 * Unlike classical chains, a Quantova signature is **post-quantum**: one of three NIST
 * schemes. The on-chain `QSignature` is a tagged union (SPHINCS+ / Falcon / Dilithium),
 * each variant carrying the signature bytes and the PQ public key that the account
 * address is derived from (SHA3-256(pubkey)[0..20], byte0 = 0x40).
 *
 * This is the interface a Ledger device app (or hybrid signer) must satisfy for Quantova
 * — and the part that does not exist on any Ledger device today (see README, "Open
 * requirement").
 */

/** The three NIST post-quantum signature schemes Quantova accounts use. */
export enum QSignatureScheme {
  SPHINCS = "sphincs+", // SLH-DSA (FIPS 205)
  FALCON = "falcon", // FN-DSA  (FIPS 206)
  DILITHIUM = "dilithium", // ML-DSA  (FIPS 204)
}

/** A post-quantum signature returned by the device, hex-encoded. */
export type QSignature = {
  scheme: QSignatureScheme;
  /** hex of the scheme's signature bytes */
  signature: string;
  /** hex of the PQ public key the account is derived from */
  publicKey: string;
};

/** Address + PQ public key as returned by `getAddress`. */
export type QuantovaAddress = {
  /** canonical "Q1…" Bech32m address */
  address: string;
  /** hex of the PQ public key */
  publicKey: string;
};

/**
 * The signer Ledger Live calls. `signTransaction` receives the SCALE-encoded signing
 * payload (call + the `TxExtension` extra, including the enabled `CheckMetadataHash`
 * digest for clear-signing) and must return a post-quantum `QSignature`.
 */
export interface QuantovaSigner {
  getAddress(path: string): Promise<QuantovaAddress>;
  signTransaction(path: string, payload: string): Promise<QSignature>;
}
