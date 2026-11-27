import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";
import type { ConcordiumCoinConfig } from "../../types";

export async function broadcast(config: ConcordiumCoinConfig, signedTx: string): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(config, data);
  return result.submissionId;
}
