import suiAPI from "../network";

/**
 * Broadcasts a transaction to the Sui network.
 *
 * @param {string} unsigned - The unsigned transaction block to be broadcasted.
 * @param {string} serializedSignature - The serialized signature for the transaction.
 * @returns {Promise<string>} A promise that resolves to the transaction digest.
 */
export async function broadcast(unsigned: string, serializedSignature: string): Promise<string> {
  const result = await suiAPI.executeTransactionBlock({
    transactionBlock: unsigned,
    signature: serializedSignature,
    options: {
      showEffects: true,
    },
  });
  return result?.digest ?? "";
}
