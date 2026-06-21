/**
 * Software reference signer (qweb3.js).
 *
 * Implements the `QuantovaSigner` contract entirely in software using Quantova's qweb3.js
 * SDK. It produces REAL, valid `QSignature` envelopes that the chain accepts — proving the
 * end-to-end post-quantum signing flow.
 *
 * ⚠️  This is a REFERENCE, not a hardware wallet: the private key lives in process memory.
 * Its purpose is (a) to exercise the bridge in CI/bots, and (b) to be the byte-exact spec a
 * Ledger device app reproduces on-chip. The device path (`deviceSigner`) holds keys in the
 * Secure Element instead; the two are interchangeable behind this interface.
 */
import type { QuantovaSigner, QuantovaAddress } from "../types/signer";
import type { QSignatureEnvelope } from "../pq/qsignature";
import { QScheme } from "../pq/schemes";
import { pairFromSeed, pairFromUri, type QPair } from "../pq/keygen";
import { bytesToHex } from "../logic/hex";

export type SoftwareSignerSource =
  | { kind: "seed"; scheme: QScheme; seed: Uint8Array }
  | { kind: "uri"; scheme: QScheme; uri: string };

/** Build a software `QuantovaSigner` from a seed or URI/mnemonic. */
export async function makeSoftwareSigner(source: SoftwareSignerSource): Promise<QuantovaSigner> {
  const pair: QPair =
    source.kind === "seed"
      ? await pairFromSeed(source.scheme, source.seed)
      : await pairFromUri(source.scheme, source.uri);

  const getAddress = async (_path: string): Promise<QuantovaAddress> => ({
    address: pair.address,
    publicKey: bytesToHex(pair.publicKey),
    scheme: pair.scheme,
  });

  const signPayload = async (_path: string, payload: Uint8Array): Promise<QSignatureEnvelope> => {
    const signature = await pair.sign(payload);
    return {
      scheme: pair.scheme,
      signature: signature instanceof Uint8Array ? signature : Uint8Array.from(signature),
      publicKey: pair.publicKey,
    };
  };

  return { getAddress, signPayload };
}
