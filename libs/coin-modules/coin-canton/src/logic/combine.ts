import type { CantonSignedEnvelope } from "../types/transaction";
import { decodeCrafted } from "./envelope";

export function combine(transaction: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Canton combine expects exactly one signature, got ${signature.length}`);
  }
  const { party, serialized } = decodeCrafted(transaction);
  const signed: CantonSignedEnvelope = { party, serialized, signature: signature[0] };
  return JSON.stringify(signed);
}
