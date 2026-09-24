import type { KaspaCoinConfig } from "../config";
import { ApiResponseBalance } from "../types";
import { getApiBase } from "./config";

export const getBalancesForAddresses = async (
  config: KaspaCoinConfig,
  addresses: string[],
): Promise<ApiResponseBalance[]> => {
  try {
    const response = await fetch(`${getApiBase(config)}/addresses/balances`, {
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

    const r = await response.json();

    return r as ApiResponseBalance[];
  } catch (error) {
    throw new Error(`Error fetching balance: ${(error as Error).message}`);
  }
};
