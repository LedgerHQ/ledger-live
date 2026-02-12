import { ApiResponseUtxo } from "../types";
import { API_BASE } from "./config";

export const getUtxosForAddresses = async (addresses: string[]): Promise<ApiResponseUtxo[]> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/utxos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs for address ${addresses}. Status: ${response.status}`);
    }

    return (await response.json()) as ApiResponseUtxo[];
  } catch (error) {
    throw new Error(`Error fetching UTXOs: ${(error as Error).message}`);
  }
};
