import type { VechainSDKTransactionBody } from "../../types";
import { VechainSDKTransaction } from "../../types";

// Attach the signature to the crafted body and return the signed, hex-encoded tx for broadcast.
export function combine(tx: string, signature: string): string {
  const body = JSON.parse(tx) as VechainSDKTransactionBody;
  const signed = VechainSDKTransaction.of(body, Buffer.from(signature, "hex"));

  return `0x${Buffer.from(signed.encoded).toString("hex")}`;
}
