import { submit } from "../../network/node";

export async function broadcast(signedTx: string): Promise<string> {
  const submittedPayment = await submit(signedTx);
  return submittedPayment.tx_hash;
}
