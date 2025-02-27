import { broadcastTron } from "../network";
import { decodeTransaction } from "./combine";

export async function broadcast(transaction: string): Promise<string> {
  const { rawTx, signature } = extractTxAndSignature(transaction);

  const { txID, raw_data } = await decodeTransaction(rawTx);

  const signedTxPayload = {
    txID,
    raw_data,
    raw_data_hex: rawTx,
    signature: [signature],
  };

  return broadcastTron(signedTxPayload);
}

function extractTxAndSignature(transaction: string): { rawTx: string; signature: string } {
  const txLength = parseInt(transaction.slice(0, 4), 16);
  const rawTx = transaction.slice(4, txLength + 4);
  const signature = transaction.slice(4 + txLength);
  return { rawTx, signature };
}