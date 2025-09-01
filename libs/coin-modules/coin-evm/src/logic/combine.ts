import { Signature, Transaction } from "ethers";

/**
 * Combines a serialized (hex string) Ethereum transaction and a signature to generate a signed transaction.
 * @param tx Serialized unsigned transaction as a hexadecimal string
 * @param signature Hexadecimal signature
 * @returns Signed transaction as a hexadecimal string
 */
export function combine(tx: string | Transaction, signature: string | Signature): string {
  const txObj = typeof tx === "string" ? Transaction.from(tx) : tx;
  const sig = typeof signature === "string" ? Signature.from(signature) : signature;

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
