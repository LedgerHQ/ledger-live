import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { submitTransfer } from "../../network/proxyClient";

/**
 * Broadcast a signed transaction
 * @param signedTx - JSON string with format: { "transactionBody": "hex", "signature": "hex" }
 * @param currency - The cryptocurrency
 * @returns Transaction hash (submission ID)
 */
export async function broadcast(signedTx: string, currency: CryptoCurrency): Promise<string> {
  // Parse the signed transaction JSON
  const { transactionBody, signature } = JSON.parse(signedTx);

  const result = await submitTransfer(currency, transactionBody, signature);
  // Return the submission ID as the transaction hash
  // The actual transaction hash will be available once the transaction is finalized
  return result.submissionId;
}
