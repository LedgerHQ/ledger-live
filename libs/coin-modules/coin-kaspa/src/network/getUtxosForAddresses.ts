import type { KaspaCoinConfig } from "../config";
import { ApiResponseUtxo } from "../types";
import { getApiBase } from "./config";

export const getUtxosForAddresses = async (
  config: KaspaCoinConfig,
  addresses: string[],
): Promise<ApiResponseUtxo[]> => {
  try {
    const response = await fetch(`${getApiBase(config)}/addresses/utxos`, {
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
