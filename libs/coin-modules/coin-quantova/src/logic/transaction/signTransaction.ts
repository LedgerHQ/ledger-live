/**
 * Sign a Quantova extrinsic with any `QuantovaSigner` (software or device).
 *
 * Flow (the proven qweb3.js path):
 *   1. qweb3.js builds the call + `TxExtension` extra. The `CheckMetadataHash` extension is
 *      set to **enabled** so the signing payload commits to the runtime's metadata digest  - 
 *      this is what lets a device clear-sign (show amount/asset/recipient) instead of
 *      blind-signing.
 *   2. We extract the raw SCALE signing-payload bytes and hand them to the `QuantovaSigner`.
 *   3. The signer returns a `QSignature` envelope; we encode it to its exact on-chain bytes
 *      (`encodeQSignature`) and attach it to the extrinsic.
 *   4. The serialized signed extrinsic is broadcast via `q_sendRawTransaction`.
 *
 * `tx`/`registry` are typed against the minimal qweb3.js surface we use, so this module
 * does not hard-depend on the SDK's full type tree.
 */
import type { QuantovaSigner } from "../../types/signer";
import { encodeQSignature } from "../../pq/qsignature";
import { bytesToHex } from "../hex";

/** Minimal view of a qweb3.js submittable extrinsic. */
export interface QSubmittable {
  /** SCALE signing-payload bytes for the given signer + options (CheckMetadataHash enabled). */
  signingPayload(address: string, options: { withMetadataHash: true; path?: string }): Promise<Uint8Array>;
  /** attach an already-computed signature envelope and finalise the extrinsic. */
  addSignature(address: string, signatureHex: string): QSubmittable;
  /** serialized signed extrinsic, ready for `q_sendRawTransaction`. */
  toHex(): string;
}

export type SignedExtrinsic = { hex: string; signerAddress: string };

/** Produce a serialized, signed Quantova extrinsic. */
export async function signTransaction(
  tx: QSubmittable,
  signer: QuantovaSigner,
  path = "",
): Promise<SignedExtrinsic> {
  const { address } = await signer.getAddress(path);

  // (1)+(2): payload bytes with the metadata hash committed.
  const payload = await tx.signingPayload(address, { withMetadataHash: true, path });

  // (3): post-quantum signature, encoded to the on-chain `QSignature` envelope.
  const envelope = await signer.signPayload(path, payload);
  const signatureHex = bytesToHex(encodeQSignature(envelope), true);

  // (4): attach + serialize.
  const hex = tx.addSignature(address, signatureHex).toHex();
  return { hex, signerAddress: address };
}
