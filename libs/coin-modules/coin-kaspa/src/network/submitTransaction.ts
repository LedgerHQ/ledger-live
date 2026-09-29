import { ApiResponseSubmitTransaction } from "../types";
import { API_BASE } from "./config";
import { fetchWithRetry } from "./fetchWithRetry";

export const submitTransaction = async (
  transactionJson: string,
): Promise<ApiResponseSubmitTransaction> => {
  // "rate-limit" only: a 429 is turned away before the node handles it, so retrying cannot broadcast
  // twice. A 5xx or a network error is not retried — the transaction may already have gone through.
  const response = await fetchWithRetry(
    `${API_BASE}/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: transactionJson,
    },
    "rate-limit",
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `kaspa: broadcast failed with status ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  const txId: string = (await response.json()).transactionId;
  return { txId };
};
