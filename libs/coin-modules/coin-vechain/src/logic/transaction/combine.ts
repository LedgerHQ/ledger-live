import type { VechainSDKTransactionBody } from "../../types";
import { VechainSDKTransaction } from "../../types";

// Attach the signature to the crafted body and return the signed, hex-encoded tx for broadcast.
export function combine(tx: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`VeChain combine expects exactly one signature, got ${signature.length}`);
  }

  const body = JSON.parse(tx) as VechainSDKTransactionBody;
  const signed = VechainSDKTransaction.of(body, Buffer.from(signature[0], "hex"));

  return `0x${Buffer.from(signed.encoded).toString("hex")}`;
}
