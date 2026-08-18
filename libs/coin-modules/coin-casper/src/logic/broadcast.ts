import { Transaction } from "casper-js-sdk";
import { broadcastTx } from "../network/api";
import type { CasperContext } from "../types/config";

export async function broadcast(context: CasperContext, tx: string): Promise<string> {
  const config = await context.config();
  return broadcastTx(config, Transaction.fromJSON(tx));
}
