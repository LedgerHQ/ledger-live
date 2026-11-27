import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";
import type { ConcordiumContext } from "../../types";

export async function broadcast(context: ConcordiumContext, signedTx: string): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(context, data);
  return result.submissionId;
}
