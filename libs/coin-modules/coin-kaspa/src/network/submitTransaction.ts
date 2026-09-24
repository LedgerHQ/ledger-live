import type { KaspaCoinConfig } from "../config";
import { ApiResponseSubmitTransaction } from "../types";
import { getApiBase } from "./config";

export const submitTransaction = async (
  config: KaspaCoinConfig,
  transactionJson: string,
): Promise<ApiResponseSubmitTransaction> => {
  const response = await fetch(`${getApiBase(config)}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: transactionJson,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `kaspa: broadcast failed with status ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  const txId: string = (await response.json()).transactionId;
  return { txId };
};
