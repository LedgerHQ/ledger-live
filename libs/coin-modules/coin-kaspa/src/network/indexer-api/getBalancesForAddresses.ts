import { API_BASE } from "./config";

interface BalanceResponse {
  address: string;
  balance: number;
}

export const getBalancesForAddresses = async (addresses: string[]): Promise<BalanceResponse[]> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/balances`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addresses: addresses }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch balance for address ${addresses}. Status: ${response.status}`,
      );
    }

    return (await response.json()) as BalanceResponse[];
  } catch (error) {
    throw new Error(`Error fetching balance: ${(error as Error).message}`);
  }
};
