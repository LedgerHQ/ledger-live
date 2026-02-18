import { ApiResponseSubmitTransaction } from "../types";
import { API_BASE } from "./config";

export const submitTransaction = async (
  transactionJson: string,
): Promise<ApiResponseSubmitTransaction> => {
  try {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: transactionJson,
    });

    if (!response.ok) {
      throw new Error(`Failed to submit transaction. Status: ${response.status}`);
    }

    const txId: string = (await response.json()).transactionId;
    return {
      txId,
    };
  } catch (error) {
    throw new Error(`Error submitting transaction: ${error}`);
  }
};
