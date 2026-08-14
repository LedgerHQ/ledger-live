/**
 * Combines a transaction body and signature into a signed transaction.
 *
 * For Concordium, this creates a JSON wrapper containing both parts separately,
 * as the wallet-proxy API requires transaction and signature as separate fields.
 * This differs from other chains where the signature is embedded into the transaction.
 *
 * @param transaction - Serialized transaction body (hex-encoded)
 * @param signature - Transaction signature (hex-encoded)
 * @returns JSON string containing both transaction and signature
 */
export function combine(transaction: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Concordium combine expects exactly one signature, got ${signature.length}`);
  }
  return JSON.stringify({
    transactionBody: transaction,
    signature: signature[0],
  });
}
