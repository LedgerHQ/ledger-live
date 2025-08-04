import { ApiResponseTransaction } from "../types";
import { API_BASE } from "./config";

export const getTransactions = async (
  address: string,
  after: number = 1,
): Promise<{ transactions: ApiResponseTransaction[]; nextPageAfter: string | null }> => {
  const response = await fetch(
    `${API_BASE}/addresses/${address}/full-transactions-page?resolve_previous_outpoints=light&limit=500&before=0&after=${after}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }

  const nextPageAfter = response.headers.get("X-Next-Page-After") || null;
  const transactions = await response.json();

  return { transactions, nextPageAfter };
};
