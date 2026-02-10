import { encode } from "../utils";

// Combines signature with raw transaction
export function combine(transaction: string, signature: string, publicKey?: string): string {
  return encode(transaction, signature, publicKey || "");
}
