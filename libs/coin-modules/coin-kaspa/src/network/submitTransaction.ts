import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseSubmitTransaction } from "../types";
import { API_BASE } from "./config";
import { BROADCAST_RETRY, httpError } from "./retryPolicy";

export const submitTransaction = (
  transactionJson: string,
): Promise<ApiResponseSubmitTransaction> => {
  // BROADCAST_RETRY retries only 429 — see retryPolicy.ts for why a 5xx or a network error is not.
  return retry(async () => {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: transactionJson,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw httpError(
        `kaspa: broadcast failed with status ${response.status}${body ? `: ${body}` : ""}`,
        response.status,
      );
    }

    const txId: string = (await response.json()).transactionId;
    return { txId };
  }, BROADCAST_RETRY);
};
