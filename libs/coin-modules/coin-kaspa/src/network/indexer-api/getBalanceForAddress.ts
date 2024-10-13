import { API_BASE } from "./config";

interface BalanceResponse {
  address: string;
  balance: number;
}

export const getBalanceForAddress = async (address: string): Promise<BalanceResponse> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/${address}/balance`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance for address ${address}. Status: ${response.status}`);
    }

    return (await response.json()) as BalanceResponse;
  } catch (error) {
    throw new Error(`Error fetching balance: ${(error as Error).message}`);
  }
};
