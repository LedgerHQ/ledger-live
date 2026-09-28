import { buildTransaction } from "../../buildTransaction";
import { CosmosCraftedTransaction } from "./craftTransaction";

function assertCombinePublicKey(pubkey: string): void {
  const bytes = Buffer.from(pubkey, "base64");
  if (bytes.length !== 33 || (bytes[0] !== 0x02 && bytes[0] !== 0x03)) {
    throw new Error("combine expects a compressed secp256k1 public key (33 bytes, base64)");
  }
}

/**
 * Attach a signature to a crafted transaction, producing the broadcastable `TxRaw`.
 *
 * @param tx        the crafted-transaction JSON from {@link craftTransaction}
 * @param signature the 64-byte fixed-length (r‖s) secp256k1 signature, hex-encoded
 * @param pubkey    the signer's compressed secp256k1 public key, base64-encoded
 */
export function combine(tx: string, signature: string[], pubkey?: string): string {
  if (signature.length !== 1) {
    throw new Error(`Cosmos combine expects exactly one signature, got ${signature.length}`);
  }
  if (!pubkey) {
    throw new Error("combine requires the signer public key");
  }
  assertCombinePublicKey(pubkey);
  if (!/^[0-9a-fA-F]{128}$/.test(signature[0])) {
    throw new Error("combine expects a 64-byte (r‖s) hex signature");
  }

  const payload = JSON.parse(tx) as CosmosCraftedTransaction;

  const protoMsgs = payload.protoMsgs.map(m => ({
    typeUrl: m.typeUrl,
    value: Uint8Array.from(Buffer.from(m.value, "base64")),
  }));

  const txBytes = buildTransaction({
    protoMsgs,
    memo: payload.memo,
    pubKeyType: payload.pubKeyType,
    pubKey: pubkey,
    feeAmount: payload.feeAmount,
    gasLimit: payload.gasLimit,
    sequence: payload.sequence,
    signature: Uint8Array.from(Buffer.from(signature[0], "hex")),
  });

  return Buffer.from(txBytes).toString("hex");
}
