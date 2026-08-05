import { Transaction } from "casper-js-sdk";
import { broadcastTx } from "../network/api";

export async function broadcast(tx: string): Promise<string> {
  return broadcastTx(Transaction.fromJSON(tx));
}
