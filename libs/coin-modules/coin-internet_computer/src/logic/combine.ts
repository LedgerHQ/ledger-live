import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { derivePrincipalFromPubkey, pubkeyToDer } from "./crypto";

const SIGNATURE_HEX = /^[\da-f]{128}$/i;

/** The call content as `Cbor.decode` returns it: principals come back as raw bytes. */
export interface DecodedCallContent extends Record<string, unknown> {
  arg: Uint8Array;
  canister_id: Uint8Array;
  ingress_expiry: bigint;
  method_name: string;
  request_type: string;
  sender: Uint8Array;
}

/**
 * Wrap the crafted call content in the envelope the node accepts: the content, the signer's
 * DER-encoded public key and its signature. Decoding and re-encoding keeps the request id, which is
 * what the node verifies the signature against.
 */
export function combine(tx: string, signatures: string[], pubkey: string | undefined): string {
  if (signatures.length !== 1) {
    throw new Error("[ICP](combine) Expected exactly one signature");
  }
  // `Buffer.from(hex)` stops at the first non-hex character instead of throwing.
  if (!SIGNATURE_HEX.test(signatures[0])) {
    throw new Error("[ICP](combine) Expected a 64-byte hex signature (r || s)");
  }
  if (!pubkey) throw new Error("[ICP](combine) pubkey is required");

  const { content } = Cbor.decode<{ content: DecodedCallContent }>(Buffer.from(tx, "hex"));
  const sender = Principal.fromUint8Array(content.sender);
  if (sender.compareTo(derivePrincipalFromPubkey(pubkey)) !== "eq") {
    throw new Error("[ICP](combine) pubkey does not match the transaction sender");
  }

  return Buffer.from(
    Cbor.encode({
      content,
      sender_pubkey: pubkeyToDer(pubkey),
      sender_sig: Buffer.from(signatures[0], "hex"),
    }),
  ).toString("hex");
}
