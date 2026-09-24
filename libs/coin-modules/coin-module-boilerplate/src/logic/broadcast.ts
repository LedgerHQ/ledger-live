import { submit } from "../network/node";
import type { BoilerplateCoinConfig } from "../config";

export async function broadcast(config: BoilerplateCoinConfig, signedTx: string): Promise<string> {
  const submittedPayment = await submit(config, signedTx);
  return submittedPayment.tx_hash;
}
