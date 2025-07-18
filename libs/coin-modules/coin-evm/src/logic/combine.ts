import { Signature, Transaction, utils } from "ethers";

/**
 * Combines a serialized (hex string) Ethereum transaction and a signature to generate a signed transaction.
 * @param tx Serialized unsigned transaction as a hexadecimal string
 * @param signature Hexadecimal signature
 * @returns Signed transaction as a hexadecimal string
 */
export function combine(tx: string | Transaction, signature: string | Signature): string {
  const { r, s, v, ...unsignedTx } = typeof tx === "string" ? utils.parseTransaction(tx) : tx;
  const sig = typeof signature === "string" ? utils.splitSignature(signature) : signature;

  return utils.serializeTransaction(unsignedTx, sig);
}
