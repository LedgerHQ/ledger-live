import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { derivePrincipalFromPubkey, pubkeyToDer } from "./crypto";

const SIGNATURE_BYTES = 64;

/** The call content as `Cbor.decode` returns it: principals come back as raw bytes. */
export interface DecodedCallContent extends Record<string, unknown> {
  arg: Uint8Array;
  canister_id: Uint8Array;
  ingress_expiry: bigint;
  method_name: string;
  request_type: string;
  sender: Uint8Array;
}

/** The read_state request content as `Cbor.decode` returns it. */
export interface DecodedReadStateContent extends Record<string, unknown> {
  ingress_expiry: bigint;
  paths: Uint8Array[][];
  request_type: string;
  sender: Uint8Array;
}

/** A crafted ledger transfer. A stake transfer carries the nonce of the neuron's stake account. */
interface DecodedTransfer {
  content: DecodedCallContent;
  stake_nonce?: unknown;
}

/** A crafted neuron command: the call and the read_state request that polls it. */
export interface DecodedNeuronCommand {
  call: DecodedCallContent;
  read_state: DecodedReadStateContent;
}

const isNeuronCommandBlob = (decoded: object): decoded is DecodedNeuronCommand =>
  "call" in decoded && "read_state" in decoded;

// `Buffer.from(hex)` stops at the first non-hex character instead of throwing.
const isHexOfLength = (value: string, bytes: number): boolean =>
  value.length === bytes * 2 && /^[\da-f]*$/i.test(value);

const requireSender = (sender: Uint8Array, pubkey: string): void => {
  if (Principal.fromUint8Array(sender).compareTo(derivePrincipalFromPubkey(pubkey)) !== "eq") {
    throw new Error("[ICP](combine) pubkey does not match the transaction sender");
  }
};

const envelope = (content: Record<string, unknown>, pubkey: string, signature: Buffer) => ({
  content,
  sender_pubkey: pubkeyToDer(pubkey),
  sender_sig: signature,
});

const combineNeuronCommand = (
  { call, read_state }: DecodedNeuronCommand,
  signature: string,
  pubkey: string,
): string => {
  if (!isHexOfLength(signature, 2 * SIGNATURE_BYTES)) {
    throw new Error(
      "[ICP](combine) Expected a 128-byte hex signature (call r || s, then read_state r || s)",
    );
  }
  requireSender(call.sender, pubkey);
  if (!Buffer.from(read_state.sender).equals(Buffer.from(call.sender))) {
    throw new Error("[ICP](combine) The read_state request has another sender than the call");
  }
  const signatures = Buffer.from(signature, "hex");
  return Buffer.from(
    Cbor.encode({
      call: envelope(call, pubkey, signatures.subarray(0, SIGNATURE_BYTES)),
      read_state: envelope(read_state, pubkey, signatures.subarray(SIGNATURE_BYTES)),
    }),
  ).toString("hex");
};

/**
 * Wrap the crafted content in the envelope the node accepts: the content, the signer's DER-encoded
 * public key and its signature. Decoding and re-encoding keeps the request id, which is what the
 * node verifies the signature against.
 *
 * A neuron command takes one signature string: the device's `requestSignatureRS` followed by its
 * `readStateSignatureRS`, both from one interaction. The generic signing flow carries one signature
 * per transaction, so the signer adapter concatenates them. It comes back as
 * `Cbor.encode({ call, read_state })`, one envelope each.
 *
 * A stake transfer comes back as `Cbor.encode({ transfer, stake_nonce })`: the signed envelope, and
 * the unsigned nonce that broadcast checks against it before claiming the neuron.
 */
export function combine(tx: string, signatures: string[], pubkey: string | undefined): string {
  if (signatures.length !== 1) {
    throw new Error("[ICP](combine) Expected exactly one signature");
  }
  if (!pubkey) throw new Error("[ICP](combine) pubkey is required");

  const decoded = Cbor.decode<DecodedTransfer | DecodedNeuronCommand>(Buffer.from(tx, "hex"));
  if (isNeuronCommandBlob(decoded)) return combineNeuronCommand(decoded, signatures[0], pubkey);

  if (!isHexOfLength(signatures[0], SIGNATURE_BYTES)) {
    throw new Error("[ICP](combine) Expected a 64-byte hex signature (r || s)");
  }
  requireSender(decoded.content.sender, pubkey);
  const signed = envelope(decoded.content, pubkey, Buffer.from(signatures[0], "hex"));
  const { stake_nonce } = decoded;
  if (stake_nonce === undefined) return Buffer.from(Cbor.encode(signed)).toString("hex");
  if (typeof stake_nonce !== "string") {
    throw new TypeError("[ICP](combine) The stake nonce is not a decimal string");
  }
  return Buffer.from(Cbor.encode({ transfer: signed, stake_nonce })).toString("hex");
}
