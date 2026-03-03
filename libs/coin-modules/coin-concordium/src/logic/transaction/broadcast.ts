import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";

export async function broadcast(signedTx: string, currency: CryptoCurrency): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(currency, data);
  return result.submissionId;
}
