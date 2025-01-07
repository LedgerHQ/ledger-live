import { ApiResponseTransaction } from "../types";
import { API_BASE } from "./config";

export const getTransactions = async (address: string): Promise<ApiResponseTransaction[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/addresses/${address}/full-transactions-page?resolve_previous_outpoints=light&limit=50&before=0`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    return (await response.json()) as ApiResponseTransaction[];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};
