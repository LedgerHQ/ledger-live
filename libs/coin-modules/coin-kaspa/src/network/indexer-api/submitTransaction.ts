import { API_BASE } from "./config";

interface SubmitTransactionResponse {
  txId: string;
}

export const submitTransaction = async (transaction: any): Promise<SubmitTransactionResponse> => {
  try {
    const response = await fetch(`${API_BASE}/transactions/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit transaction. Status: ${response.status}`);
    }

    const txId: string = await response.text();
    return {
      txId,
    };
  } catch (error) {
    throw new Error(`Error submitting transaction: ${error}`);
  }
};
