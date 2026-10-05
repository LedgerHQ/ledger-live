import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseAddressActive } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

export const getAddressesActive = async (
  addresses: string[],
): Promise<ApiResponseAddressActive[]> => {
  try {
    return await retry(async () => {
      const response = await fetch(`${API_BASE}/addresses/active`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw httpError(
          `Failed to fetch active state for addresses ${addresses}. Status: ${response.status}`,
          response.status,
        );
      }

      return (await response.json()) as ApiResponseAddressActive[];
    }, READ_RETRY);
  } catch (error) {
    throw new Error(`Error fetching AddressesActives: ${(error as Error).message}`);
  }
};
