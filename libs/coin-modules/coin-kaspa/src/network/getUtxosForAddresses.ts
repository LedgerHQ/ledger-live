import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseUtxo } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getUtxosForAddresses = async (addresses: string[]): Promise<ApiResponseUtxo[]> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/addresses/utxos`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw httpError(
          `Failed to fetch UTXOs for address ${addresses}. Status: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as ApiResponseUtxo[];
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Error fetching UTXOs: ${(error as Error).message}`);
  }
};
