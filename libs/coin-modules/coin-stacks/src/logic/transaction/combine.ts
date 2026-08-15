import { deserializeTransaction } from "@stacks/transactions";
import { applySignatureToTransaction } from "../../common-logic";

/** Deserializes the crafted (unsigned) transaction, attaches the device signature, and
 * re-serializes to the hex string `broadcast` expects. */
export function combine(tx: string, signature: string): string {
  const parsed = deserializeTransaction(tx.replace(/^0x/, ""));
  const signed = applySignatureToTransaction(parsed, signature);
  return `0x${signed.toString("hex")}`;
}
