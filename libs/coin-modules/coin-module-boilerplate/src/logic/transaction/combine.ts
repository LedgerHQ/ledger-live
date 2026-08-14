import { encode } from "../utils";

// Combines signature with raw transaction
export function combine(transaction: string, signature: string[], publicKey?: string): string {
  if (signature.length !== 1) {
    throw new Error(`Boilerplate combine expects exactly one signature, got ${signature.length}`);
  }
  return encode(transaction, signature[0], publicKey || "");
}
