import { buildTransaction } from "../../buildTransaction";
import { CosmosCraftedTransaction } from "./craftTransaction";

/**
 * Attach a signature to a crafted transaction, producing the broadcastable `TxRaw`.
 *
 * @param tx        the crafted-transaction JSON from {@link craftTransaction}
 * @param signature the 64-byte fixed-length (r‖s) secp256k1 signature, hex-encoded
 * @param pubkey    the signer's compressed secp256k1 public key, base64-encoded
 */
export function combine(tx: string, signature: string, pubkey?: string): string {
  if (!pubkey) {
    throw new Error("combine requires the signer public key");
  }
  if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
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
    signature: Uint8Array.from(Buffer.from(signature, "hex")),
  });

  return Buffer.from(txBytes).toString("hex");
}
