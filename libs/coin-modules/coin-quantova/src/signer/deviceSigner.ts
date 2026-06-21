/**
 * Device signer contract - the target for a Ledger `app-quantova`.
 *
 * This is the SAME `QuantovaSigner` interface as the software reference, but backed by a
 * Ledger device app over a transport (APDU). The app must:
 *
 *   1. derive the account's PQ keypair on-chip for the BIP-44 `path` (key never leaves
 *      the Secure Element);
 *   2. on `signPayload`, parse the SCALE payload, verify the embedded `CheckMetadataHash`
 *      digest against the app's metadata so it can display amount / asset / recipient
 *      (clear-signing, not blind-signing), and on user approval return the PQ signature;
 *   3. emit the `QSignature` envelope exactly as `pq/qsignature.ts` specifies.
 *
 * No such app exists yet - `signPayload` here throws until a device app is available.
 * The APDU command set is intentionally left as the integration point for Ledger.
 */
import type { QuantovaSigner, QuantovaAddress } from "../types/signer";
import type { QSignatureEnvelope } from "../pq/qsignature";

/** A minimal APDU transport (e.g. `@ledgerhq/hw-transport`). */
export interface QuantovaTransport {
  send(cla: number, ins: number, p1: number, p2: number, data: Buffer): Promise<Buffer>;
}

/** Placeholder APDU instruction set for a future `app-quantova`. */
export const QUANTOVA_APDU = {
  CLA: 0xe0,
  INS_GET_PUBLIC_KEY: 0x02,
  INS_SIGN: 0x04,
} as const;

export function makeDeviceSigner(_transport: QuantovaTransport): QuantovaSigner {
  return {
    async getAddress(_path: string): Promise<QuantovaAddress> {
      throw new Error(
        "app-quantova device app not available yet: post-quantum key derivation is the open " +
          "requirement we are raising with Ledger (see README).",
      );
    },
    async signPayload(_path: string, _payload: Uint8Array): Promise<QSignatureEnvelope> {
      throw new Error(
        "app-quantova device app not available yet: on-device Dilithium/Falcon/SPHINCS+ signing " +
          "is the capability this PR proposes Ledger add.",
      );
    },
  };
}
