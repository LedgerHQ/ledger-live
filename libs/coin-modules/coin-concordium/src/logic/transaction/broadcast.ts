import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";

export async function broadcast(signedTx: string, currencyId: string): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(currencyId, data);
  return result.submissionId;
}
