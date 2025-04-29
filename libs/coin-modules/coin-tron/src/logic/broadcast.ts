import { broadcastTron } from "../network";
import { decodeTransaction } from "./utils";

type TxObject = {
  txID: string;
  raw_data: Record<string, unknown> | undefined;
  signature: string[];
};

export async function broadcast(transaction: string | TxObject): Promise<string> {
  if (typeof transaction === "string") {
    const { rawTx, signature } = extractTxAndSignature(transaction);

    const { txID, raw_data } = await decodeTransaction(rawTx);

    const signedTxPayload = {
      txID,
      raw_data,
      raw_data_hex: rawTx,
      signature: [signature],
    };

    return broadcastTron(signedTxPayload);
  } else {
    return broadcastTron(transaction);
  }
}

function extractTxAndSignature(transaction: string): { rawTx: string; signature: string } {
  const txLength = parseInt(transaction.slice(0, 4), 16);
  const rawTx = transaction.slice(4, txLength + 4);
  const signature = transaction.slice(4 + txLength);
  return { rawTx, signature };
}
