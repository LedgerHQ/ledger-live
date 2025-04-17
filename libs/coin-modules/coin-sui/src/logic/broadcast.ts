import { ExecuteTransactionBlockParams } from "@mysten/sui/client";
import suiAPI from "../network";

/**
 * Broadcasts a transaction to the Sui network.
 *
 * @param {string} unsigned - The unsigned transaction block to be broadcasted.
 * @param {string} serializedSignature - The serialized signature for the transaction.
 * @returns {Promise<string>} A promise that resolves to the transaction digest.
 */
export async function broadcast(
  transaction: string | ExecuteTransactionBlockParams,
): Promise<string> {
  let params: ExecuteTransactionBlockParams;
  if (typeof transaction === "string") {
    const { rawTx, signature } = extractTxAndSignature(transaction);

    params = {
      transactionBlock: rawTx,
      signature: signature,
      options: {
        showEffects: true,
      },
    };
  } else {
    params = transaction;
  }
  const result = await suiAPI.executeTransactionBlock(params);
  return result?.digest ?? "";
}

function extractTxAndSignature(transaction: string): { rawTx: string; signature: string } {
  const txLength = parseInt(transaction.slice(0, 4), 16);
  const rawTx = transaction.slice(4, txLength + 4);
  const signature = transaction.slice(4 + txLength);
  return { rawTx, signature };
}
