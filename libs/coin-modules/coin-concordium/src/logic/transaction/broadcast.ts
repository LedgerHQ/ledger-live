import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";
import type { ConcordiumCoinConfig } from "../../types";

export async function broadcast(
  signedTx: string,
  currencyId: string,
  config?: ConcordiumCoinConfig,
): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(currencyId, data, config);
  return result.submissionId;
}
