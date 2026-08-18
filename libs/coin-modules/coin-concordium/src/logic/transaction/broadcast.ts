import { submitTransfer } from "../../network/proxyClient";
import { buildSubmitTransferData } from "../../network/utils";
import type { ConcordiumCoinConfig } from "../../types";

export async function broadcast(
  config: ConcordiumCoinConfig,
  signedTx: string,
  currencyId: string,
): Promise<string> {
  const { transactionBody, signature } = JSON.parse(signedTx);
  const data = buildSubmitTransferData(transactionBody, signature);

  const result = await submitTransfer(config, currencyId, data);
  return result.submissionId;
}
