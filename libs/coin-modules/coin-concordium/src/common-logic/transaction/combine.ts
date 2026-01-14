import { encodeSignedTransaction } from "../utils";

export function combine(transaction: string, signature: string): string {
  return encodeSignedTransaction(transaction, signature);
}
