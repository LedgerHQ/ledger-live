import suiAPI from "../network";

/**
 * Broadcasts a transaction to the Sui network.
 *
 * @param {Uint8Array} unsigned - The unsigned transaction block to be broadcasted.
 * @param {string} serializedSignature - The serialized signature for the transaction.
 * @returns {Promise<string>} A promise that resolves to the transaction digest.
 */
export async function broadcast(
  unsigned: Uint8Array,
  serializedSignature: string,
): Promise<string> {
  const result = await suiAPI.executeTransactionBlock({
    transactionBlock: unsigned,
    signature: serializedSignature,
    options: {
      showEffects: true,
    },
  });
  return result?.digest ?? "";
}
