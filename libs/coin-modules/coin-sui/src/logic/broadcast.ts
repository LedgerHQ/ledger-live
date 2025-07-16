import { ExecuteTransactionBlockParams } from "@mysten/sui/client";
import suiAPI from "../network";

/**
 * Broadcasts a transaction to the Sui network.
 *
 * @param {string | ExecuteTransactionBlockParams} transaction - serialized signed transaction with signature or object with params and signature
 * @returns {Promise<string>} A promise that resolves to the transaction digest.
 */
export async function broadcast(
  transaction: string | ExecuteTransactionBlockParams,
): Promise<string> {
  let params: ExecuteTransactionBlockParams;
  if (typeof transaction === "string") {
    const { rawTx, signature, success } = extractTxAndSignature(transaction);
    if (!success) return "";

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

function extractTxAndSignature(transaction: string): {
  rawTx: string;
  signature: string;
  success: boolean;
} {
  if (transaction.length < 6) return { rawTx: "", signature: "", success: false };
  const hex = transaction.slice(0, 4);
  if (!isHexString(hex)) return { rawTx: "", signature: "", success: false };
  const txLength = parseInt(hex, 16);
  const rawTx = transaction.slice(4, txLength + 4);
  const signature = transaction.slice(4 + txLength);
  return { rawTx, signature, success: true };
}

function isHexString(str: string) {
  return /^[0-9a-fA-F]+$/.test(str);
}
