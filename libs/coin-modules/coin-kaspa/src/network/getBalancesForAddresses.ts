import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseBalance } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getBalancesForAddresses = async (
  addresses: string[],
): Promise<ApiResponseBalance[]> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/addresses/balances`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addresses: addresses }),
      });

      if (!response.ok) {
        throw httpError(
          `Failed to fetch balance for address ${addresses}. Status: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as ApiResponseBalance[];
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Error fetching balance: ${(error as Error).message}`);
  }
};
