import { ApiResponseSubmitTransaction } from "../types";
import { API_BASE } from "./config";

export const submitTransaction = async (
  transactionJson: string,
): Promise<ApiResponseSubmitTransaction> => {
  const response = await fetch(`${API_BASE}/transactions`, {
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
