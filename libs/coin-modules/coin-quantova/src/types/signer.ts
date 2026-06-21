/**
 * Quantova device-signer contract.
 *
 * A Quantova signature is **post-quantum**: one of three NIST schemes (SPHINCS+ / Falcon
 * / Dilithium), wrapped in the on-chain `QSignature` envelope. This is the interface a
 * Ledger device app (or the software reference signer) must satisfy - and the
 * device-side part is what no Ledger device can do today (see README "Open requirement").
 */
import type { QScheme } from "../pq/schemes";
import type { QSignatureEnvelope } from "../pq/qsignature";

/** Address + PQ public key as returned by `getAddress`. */
export type QuantovaAddress = {
  /** canonical "Q1..." Bech32m address */
  address: string;
  /** PQ public key, hex-encoded */
  publicKey: string;
  /** which PQ scheme this account uses */
  scheme: QScheme;
};

/**
 * The signer Ledger Live calls. `signPayload` receives the SCALE-encoded signing payload
 * (call + the `TxExtension` extra, including the **enabled** `CheckMetadataHash` digest so
 * the device can clear-sign) and returns a post-quantum `QSignature` envelope.
 *
 * Both a software reference signer (qweb3.js) and a future on-device app implement this.
 */
export interface QuantovaSigner {
  getAddress(path: string): Promise<QuantovaAddress>;
  signPayload(path: string, payload: Uint8Array): Promise<QSignatureEnvelope>;
}

export type { QSignatureEnvelope };
