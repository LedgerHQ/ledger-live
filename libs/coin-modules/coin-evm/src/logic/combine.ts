import { Signature, type SignatureLike, Transaction } from "ethers";

function prefixHexString(hex: string): string {
  return hex.startsWith("0x") ? hex : "0x" + hex;
}

/**
 * Combines a serialized (hex string) Ethereum transaction and a signature to generate a signed transaction.
 * @param tx Serialized unsigned transaction as a hexadecimal string
 * @param signature Hexadecimal signature or any `SignatureLike` (e.g. `{ r, s, v }` returned by the DMK).
 * @returns Signed transaction as a hexadecimal string
 */
export function combine(
  tx: string | Transaction,
  signature: string | SignatureLike,
): string {
  const txObj = typeof tx === "string" ? Transaction.from(prefixHexString(tx)) : tx;
  const sig =
    typeof signature === "string" ? Signature.from(prefixHexString(signature)) : Signature.from(signature);

  // Extract only raw fields manually to avoid class instance issues
  const unsignedTx = {
    type: txObj.type,
    to: txObj.to ?? undefined,
    nonce: txObj.nonce,
    gasLimit: txObj.gasLimit,
    gasPrice: txObj.gasPrice,
    maxPriorityFeePerGas: txObj.maxPriorityFeePerGas ?? undefined,
    maxFeePerGas: txObj.maxFeePerGas ?? undefined,
    data: txObj.data,
    value: txObj.value,
    chainId: txObj.chainId,
    accessList: txObj.accessList ?? undefined,
  } as Partial<Transaction>;

  return Transaction.from({
    ...unsignedTx,
    signature: sig,
  }).serialized;
}
